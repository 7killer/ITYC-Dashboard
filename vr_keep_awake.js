/*****************************************************/
/* ITYC - VRO Presence Simulation By LSV             */
/* Special thanks to PapaSmurf for his contribution  */
/*****************************************************/

var KEEP_AWAKE_WARN = false;
var KEEP_AWAKE_ERR = true;

(() => {
    "use strict";

    const KEEP_AWAKE_STATE_KEY = "__ITYC_VR_KEEP_AWAKE__";
    const DEFAULT_BACKGROUND_FRAME_DELAY = 1000;

    if (window[KEEP_AWAKE_STATE_KEY]) {
        return window[KEEP_AWAKE_STATE_KEY];
    }

    const nativeRAF = window.requestAnimationFrame.bind(window);
    const nativeCancelRAF = window.cancelAnimationFrame.bind(window);
    const nativeSetTimeout = window.setTimeout.bind(window);
    const nativeClearTimeout = window.clearTimeout.bind(window);

    function configWarn(...args) {
        if (KEEP_AWAKE_WARN) {
            console.warn(...args);
        }
    }

    function configError(...args) {
        if (KEEP_AWAKE_ERR) {
            console.error(...args);
        }
    }

    function findNativeGetter(object, propertyName) {
        let prototype = object;

        while (prototype) {
            const descriptor =
                Object.getOwnPropertyDescriptor(prototype, propertyName);

            if (descriptor?.get) {
                return descriptor.get.bind(object);
            }

            prototype = Object.getPrototypeOf(prototype);
        }

        return null;
    }

    const getRealHidden = findNativeGetter(document, "hidden");

    function isReallyHidden() {
        try {
            return getRealHidden ? Boolean(getRealHidden()) : false;
        } catch (error) {
            return false;
        }
    }

    const keepAwakeState = {
        enabled: true,
        visibilityGuardEnabled: true,
        throttleGuardEnabled: true,
        rtcStatus: "idle",
        rtcError: null,
        rtc: null,
        lastBackgroundFrame: null,
        backgroundFrameDelay: DEFAULT_BACKGROUND_FRAME_DELAY,
        isReallyHidden,
        restartRTC: async () => false
    };

    Object.defineProperty(
        window,
        KEEP_AWAKE_STATE_KEY,
        {
            value: keepAwakeState,
            configurable: false
        }
    );

    /*
     * =====================================================
     * 1. Simulation de visibilité et de focus
     * =====================================================
     */

    function forceGetter(target, propertyName, value) {
        try {
            Object.defineProperty(
                target,
                propertyName,
                {
                    configurable: true,
                    get: () => value
                }
            );
        } catch (error) {
            configWarn(
                `[SIM] Impossible de redéfinir ${propertyName}`,
                error
            );
        }
    }

    function forceDocumentProperty(propertyName, value) {
        forceGetter(Document.prototype, propertyName, value);
        forceGetter(document, propertyName, value);
    }

    forceDocumentProperty("hidden", false);
    forceDocumentProperty("webkitHidden", false);
    forceDocumentProperty("mozHidden", false);
    forceDocumentProperty("msHidden", false);
    forceDocumentProperty("visibilityState", "visible");
    forceDocumentProperty("webkitVisibilityState", "visible");

    try {
        Object.defineProperty(
            Document.prototype,
            "hasFocus",
            {
                configurable: true,
                value: () => true
            }
        );

        Object.defineProperty(
            document,
            "hasFocus",
            {
                configurable: true,
                value: () => true
            }
        );
    } catch (error) {
        configWarn(
            "[SIM] Impossible de redéfinir document.hasFocus()",
            error
        );
    }

    let focusScheduled = false;

    function simulateFocus() {
        if (focusScheduled) {
            return;
        }

        focusScheduled = true;

        queueMicrotask(() => {
            focusScheduled = false;
            window.dispatchEvent(new FocusEvent("focus"));
            document.dispatchEvent(new FocusEvent("focus"));
        });
    }

    function blockEventHandlerProperty(target, propertyName) {
        try {
            Object.defineProperty(
                target,
                propertyName,
                {
                    configurable: true,
                    get: () => null,
                    set: () => {}
                }
            );
        } catch (error) {
            console.debug(
                `[SIM] Impossible de neutraliser ${propertyName}`,
                error
            );
        }
    }

    for (const propertyName of [
        "onvisibilitychange",
        "onwebkitvisibilitychange",
        "onmozvisibilitychange",
        "onmsvisibilitychange"
    ]) {
        blockEventHandlerProperty(document, propertyName);
    }

    blockEventHandlerProperty(window, "onblur");

    window.addEventListener(
        "blur",
        event => {
            const target = event.target;
            const isWindowBlur = target === window;
            const isHiddenCanvasBlur =
                isReallyHidden() && target instanceof HTMLCanvasElement;
            const isHiddenDocumentBlur =
                isReallyHidden() && target === document;

            if (!isWindowBlur && !isHiddenCanvasBlur && !isHiddenDocumentBlur) {
                return;
            }

            event.stopImmediatePropagation();
            simulateFocus();

            console.debug("[SIM] Perte de focus VRO neutralisée");
        },
        true
    );

    function neutralizeVisibilityChange(event) {
        const reallyHidden = isReallyHidden();

        migratePendingAnimationFrames(
            keepAwakeState.throttleGuardEnabled && reallyHidden
        );

        event.stopImmediatePropagation();
        simulateFocus();

        console.debug(
            "[SIM] Visibilité neutralisée",
            {
                reallyHidden,
                throttleGuardEnabled: keepAwakeState.throttleGuardEnabled,
                pendingFrames: animationJobs.size
            }
        );
    }

    window.addEventListener(
        "visibilitychange",
        neutralizeVisibilityChange,
        true
    );

    document.addEventListener(
        "visibilitychange",
        neutralizeVisibilityChange,
        true
    );

    /*
     * =====================================================
     * 2. Maintien de la boucle Unity en arrière-plan
     * =====================================================
     */

    let nextAnimationId = 1;
    const animationJobs = new Map();
    let animationFrameGuardInstalled = false;

    function scheduleVisibleFrame(animationId, callback) {
        const nativeId =
            nativeRAF(timestamp => {
                animationJobs.delete(animationId);
                callback(timestamp);
            });

        animationJobs.set(
            animationId,
            {
                type: "raf",
                id: nativeId,
                callback
            }
        );
    }

    function scheduleBackgroundFrame(animationId, callback) {
        const timerId =
            nativeSetTimeout(() => {
                animationJobs.delete(animationId);
                keepAwakeState.lastBackgroundFrame = Date.now();
                callback(performance.now());
            }, keepAwakeState.backgroundFrameDelay);

        animationJobs.set(
            animationId,
            {
                type: "timer",
                id: timerId,
                callback
            }
        );
    }

    function simRequestAnimationFrame(callback) {
        const animationId = nextAnimationId++;

        if (keepAwakeState.throttleGuardEnabled && isReallyHidden()) {
            scheduleBackgroundFrame(animationId, callback);
        } else {
            scheduleVisibleFrame(animationId, callback);
        }

        return animationId;
    }

    function simCancelAnimationFrame(animationId) {
        const job = animationJobs.get(animationId);

        if (!job) {
            return;
        }

        animationJobs.delete(animationId);

        if (job.type === "raf") {
            nativeCancelRAF(job.id);
        } else {
            nativeClearTimeout(job.id);
        }
    }

    function migratePendingAnimationFrames(useBackgroundTimers) {
        const pendingJobs = Array.from(animationJobs.entries());

        for (const [animationId, job] of pendingJobs) {
            if (useBackgroundTimers && job.type === "raf") {
                nativeCancelRAF(job.id);
                scheduleBackgroundFrame(animationId, job.callback);
                continue;
            }

            if (!useBackgroundTimers && job.type === "timer") {
                nativeClearTimeout(job.id);
                scheduleVisibleFrame(animationId, job.callback);
            }
        }
    }

    function installAnimationFrameGuard() {
        if (animationFrameGuardInstalled) {
            return;
        }

        Object.defineProperty(
            window,
            "requestAnimationFrame",
            {
                configurable: true,
                writable: true,
                value: simRequestAnimationFrame
            }
        );

        Object.defineProperty(
            window,
            "cancelAnimationFrame",
            {
                configurable: true,
                writable: true,
                value: simCancelAnimationFrame
            }
        );

        animationFrameGuardInstalled = true;
    }

    function restoreNativeAnimationFrame() {
        if (!animationFrameGuardInstalled) {
            return;
        }

        migratePendingAnimationFrames(false);

        Object.defineProperty(
            window,
            "requestAnimationFrame",
            {
                configurable: true,
                writable: true,
                value: nativeRAF
            }
        );

        Object.defineProperty(
            window,
            "cancelAnimationFrame",
            {
                configurable: true,
                writable: true,
                value: nativeCancelRAF
            }
        );

        animationFrameGuardInstalled = false;
    }

    /*
     * =====================================================
     * 3. Connexion WebRTC locale
     * =====================================================
     */

    function waitForIceGathering(pc) {
        if (pc.iceGatheringState === "complete") {
            return Promise.resolve();
        }

        return new Promise(resolve => {
            let completed = false;

            function finish() {
                if (completed) {
                    return;
                }

                completed = true;
                nativeClearTimeout(timeoutId);
                pc.removeEventListener(
                    "icegatheringstatechange",
                    handleStateChange
                );
                resolve();
            }

            function handleStateChange() {
                if (pc.iceGatheringState === "complete") {
                    finish();
                }
            }

            const timeoutId = nativeSetTimeout(finish, 3000);

            pc.addEventListener(
                "icegatheringstatechange",
                handleStateChange
            );
        });
    }

    function stopLocalWebRTC(status = "disabled") {
        const rtcState = keepAwakeState.rtc;

        if (!rtcState) {
            keepAwakeState.rtcStatus = status;
            return;
        }

        try {
            nativeClearTimeout(rtcState.pingTimer);
            rtcState.channel?.close();
            rtcState.remoteChannel?.close();
            rtcState.sender?.close();
            rtcState.receiver?.close();
        } catch (error) {
            console.debug("[SIM] Fermeture RTC", error);
        }

        keepAwakeState.rtc = null;
        keepAwakeState.rtcStatus = status;
    }

    async function startLocalWebRTC() {
        if (!keepAwakeState.throttleGuardEnabled) {
            stopLocalWebRTC("disabled");
            return false;
        }

        if (!window.RTCPeerConnection) {
            keepAwakeState.rtcStatus = "unsupported";
            configWarn("[SIM] RTCPeerConnection indisponible");
            return false;
        }

        stopLocalWebRTC("connecting");
        keepAwakeState.rtcError = null;

        const sender =
            new RTCPeerConnection({
                iceServers: []
            });

        const receiver =
            new RTCPeerConnection({
                iceServers: []
            });

        const channel =
            sender.createDataChannel("sim-vro-presence");

        const rtcState = {
            sender,
            receiver,
            channel,
            remoteChannel: null,
            pingTimer: null
        };

        keepAwakeState.rtc = rtcState;
        keepAwakeState.rtcStatus = "connecting";

        receiver.addEventListener(
            "datachannel",
            event => {
                rtcState.remoteChannel = event.channel;
                rtcState.remoteChannel.onmessage = () => {};
            }
        );

        await sender.setLocalDescription(await sender.createOffer());
        await waitForIceGathering(sender);

        await receiver.setRemoteDescription(sender.localDescription);
        await receiver.setLocalDescription(await receiver.createAnswer());
        await waitForIceGathering(receiver);

        await sender.setRemoteDescription(receiver.localDescription);

        await new Promise((resolve, reject) => {
            if (channel.readyState === "open") {
                resolve();
                return;
            }

            const timeoutId =
                nativeSetTimeout(() => {
                    reject(new Error("Timeout ouverture DataChannel"));
                }, 5000);

            channel.addEventListener(
                "open",
                () => {
                    nativeClearTimeout(timeoutId);
                    resolve();
                },
                { once: true }
            );
        });

        if (keepAwakeState.rtc !== rtcState) {
            return false;
        }

        keepAwakeState.rtcStatus = "open";

        channel.addEventListener(
            "close",
            () => {
                if (keepAwakeState.rtc !== rtcState) {
                    return;
                }

                keepAwakeState.rtcStatus = "closed";
                configWarn("[SIM] DataChannel locale fermée");
            }
        );

        channel.addEventListener(
            "error",
            error => {
                if (keepAwakeState.rtc !== rtcState) {
                    return;
                }

                keepAwakeState.rtcStatus = "error";
                configWarn("[SIM] Erreur DataChannel", error);
            }
        );

        function sendKeepAlive() {
            if (
                keepAwakeState.rtc !== rtcState ||
                !keepAwakeState.throttleGuardEnabled
            ) {
                return;
            }

            if (channel.readyState !== "open") {
                keepAwakeState.rtcStatus = channel.readyState;
                return;
            }

            try {
                channel.send("SimKeepAlive");
            } catch (error) {
                configWarn("[SIM] Échec du keep-alive RTC", error);
            }

            rtcState.pingTimer =
                nativeSetTimeout(sendKeepAlive, 20000);
        }

        sendKeepAlive();
        console.info("[SIM] DataChannel locale ouverte");
        return true;
    }

    keepAwakeState.restartRTC = async () => {
        try {
            return await startLocalWebRTC();
        } catch (error) {
            keepAwakeState.rtcStatus = "error";
            keepAwakeState.rtcError = {
                name: error?.name ?? "RTCError",
                message: error?.message ?? String(error),
                stack: error?.stack ?? null
            };

            configError(
                "[SIM] Échec de la connexion RTC",
                keepAwakeState.rtcError
            );

            stopLocalWebRTC("error");
            return false;
        }
    };


    if (keepAwakeState.throttleGuardEnabled) {
        installAnimationFrameGuard();
        migratePendingAnimationFrames(isReallyHidden());
        void keepAwakeState.restartRTC();
    } else {
        restoreNativeAnimationFrame();
        stopLocalWebRTC("disabled");
    }

    console.info(
        "[SIM] Maintien VRO en arrière-plan initialisé",
        {
            throttleGuardEnabled: keepAwakeState.throttleGuardEnabled
        }
    );

    return keepAwakeState;
})();

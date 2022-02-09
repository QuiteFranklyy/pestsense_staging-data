/////////////////////////////////////////// Lightweight MQTT Client (v3.11 support) webworker

//TODO: message class

var messageEvent = "MQTTEvents";                    // Message class
var MQTTNet;                                        // MQTT function wrapper
var decoder = new TextDecoder();
var encoder = new TextEncoder();
var connectDetails;

// messages from parent
self.onmessage = function (e) {
    if (typeof e.data.func !== "undefined") {
        switch (e.data.func) {
            case "start":
                connectDetails = e.data;
                MQTTNet = MQTTServices(e.data.protocol, e.data.serverName, e.data.port);
                break;
            case "publish":
                MQTTNet.publish(e.data.topic, e.data.payload);
                break;
            case "subscribe":
                MQTTNet.subscribe(e.data.topicArr);
                break;
            case "unsubscribe":
                MQTTNet.unsubscribe(e.data.topicArr);
                break;
            case "connect":
                // NOTE: Should be using a session token here, not a username/password
                MQTTNet.connect(e.data.clientname, e.data.username, e.data.password);
                break;
            case "reconnect":
                MQTTNet.reconnect();
                break;
            case "close":
                MQTTNet.close();
                break;
            default:
                console.log("MQTT webworker ERROR - Incorrect command function received: " + e.data.func);
                break;
        }
    }
    else {
        console.log("MQTT webworker ERROR - Command function is undefined");
    }
}

// Post back to client parent, using JS event format
function sendParent(event, type, data) {
    postMessage({
        "eventType": type,
        "data": data
    });
}

self.onmessageerror = function () {
    console.log("MQTT webworker ERROR - Message from parent cannot be handled.");
}

function MQTTServices(protocol, serverName, port) {
    var net = {
        wsMQTT: null,                                                                                               // Reference to client WebSocket
        KEEPALIVE: 255,                                                                                             // Seconds between ping messages if no other traffic - NOTE THIS CODE ONLY SUPPORTS UP TO 255 SECONDS
        retain: true,                                                                                               // For publish, server to retain (persist) value
        QoS: 0,                                                                                                     // QoS for published messages (0 = no guarantee delivery, 1 = guaranteed delivery, 2 = exactly one delivery). QoS 0 only supported
        netState: "DISCONNECTED",                                                                                   // Current network state
        responseTimeout: 25,                                                                                        // Timeout waiting for server to respond
        msgTimer: null,                                                                                             // Message response setTimeout reference
        keepAliveInterval: null,                                                                                    // Keepalive period timer reference
        connPayload: null,                                                                                          // GLobal for connection payload once websocket connection is open
        packetID: 0                                                                                                 // counter for unique packetID
    };

    WSConnect();

    var CTRLCODE = {
        CONNECT: 0x10, CONNACK: 0x20, PUBLISH: 0x30, PUBACK: 0x40, PUBREC: 0x50, PUBREL: 0x62, PUBCOMP: 0x70, SUBSCRIBE: 0x82, SUBACK: 0x90, UNSUBSCRIBE: 0xA2, UNSUBACK: 0xB0, PINGSEND: 0xC0, PINGRESP: 0xD0, DISCONNECT: 0xE0
    };

    var CONNACKCODE = {
        1: "Incorrect protocol version",
        2: "Identifier rejected",
        3: "Service unavailable",
        4: "Bad user name or password",
        5: "Not authorized"
    };

    function WSConnect() {
        try {
            net.wsMQTT = new WebSocket(protocol + "//" + serverName + ":" + port, "MQTT");
            net.wsMQTT.binaryType = "arraybuffer";
        } catch (ex) {
            MQTTSessEnd("System error starting network. Ensure you are using a current browser. Error: " + ex.toString(), 100);
            return false;
        }

        net.wsMQTT.onopen = function () {
            net.netState = "WSCONNECTED";
            sendParent(messageEvent, "WSCONNECTED");
        }

        net.wsMQTT.onmessage = function (evt) {
            MQTTRecvMsg(evt);
        }

        net.wsMQTT.onerror = function (evt) {
            var errStr = "Network error detected. Session with server closed.";
            if (net.netState === "DISCONNECTED") {                                                  // Haven't had a server response
                errStr = "Can't connect to Server " + serverName + ". Retrying...";
            } else {
                net.netState = "ERROR";
            }
            MQTTSessEnd("Network error: " + errStr, 99);
        }

        net.wsMQTT.onclose = function (evt) {
            if (net.netState !== "DISCONNECTED") {                                                          // onError is fired first, so ignore close
                MQTTSessEnd("Network session with server closed.", 98);
            }
        }
    }

    function MQTTConnect(clientName, username, password) {
        // Connflags - Bit 0 reserved: 0, bit 1 Clean session: 1 (purge old state), bit 2 Will flag: 0 (no will), bit 3/4 Will QoS flag: 0 (no QoS), bit 5 Will retain: 0 (no retain), bit 6 Username: 1 (use username), bit 7 Password: 1 (use password)
        net.connPayload = [0, 4, 77, 81, 84, 84, 4, 1 << 7 | 1 << 6 | 0 << 5 | 0 << 4 | 0 << 3 | 0 << 2 | 1 << 1, 0, net.KEEPALIVE];     // variable header. Connect packet assume less 128 bytes. protocol level 4 MQTT v3.11
        net.connPayload = net.connPayload.concat(encodeUTF8(clientName, true), encodeUTF8(username, true), encodeUTF8(password, true));

        MQTTSend(CTRLCODE.CONNECT, net.connPayload);
        net.netState = "AUTHENTICATING";
    }

    // process MQTT messages received
    function MQTTRecvMsg(evt) {
        var recvArr = new Uint8Array(evt.data);

        clearTimeout(net.msgTimer);

        // Hack to clear the browser cache before logon (format CLEARCACHEyyyyMMddTHHmmss)
        if (recvArr.length === 25) {
            var recvStr = String.fromCharCode.apply(null, recvArr);
            if (recvStr.indexOf("CLEARCACHE") === 0) {
                sendParent(messageEvent, "CLEARCACHE", recvStr.substr(10));
                return;
            }
        }

        var recvLen = 0;
        var lenMult = 1;
        for (var i = 0; i < recvArr.length; i++) {                                                                  // Decode MQTT remaining length buffer
            recvLen += (recvArr[i + 1] & 0x7F) * lenMult;
            lenMult *= 0x80;
            if (recvArr[i + 1] < 0x80)
                break;                                                                                              // No more bytes to encode length if value < 128
            if (i === 3) {
                MQTTSessEnd("Incorrect MQTT message length received, length encoded as > 256Mb.", 97);
                return false;
            }
        }

        var payPtr = i + 2;                                                                                         // Pointer to the start of the payload
        if (recvArr.length !== (recvLen + payPtr)) {
            MQTTSessEnd("Incorrect MQTT message length received, got " + recvArr.length + " but expecting " + (recvArr[1] + 2) + " bytes.", 97);
            return false;
        }

        switch (recvArr[0] & 0xF0) {
            case CTRLCODE.CONNACK:
                switch (recvArr[3]) {                                                                               // Connect return code
                    case 0:
                        net.netState = "SESSION";                                                                   // MQTT Session active
                        sendParent(messageEvent, "SESSION");
                        break;
                    default:                                                                                        // Server connect error
                        MQTTSessEnd("Server " + serverName + " rejected connection. Status: " + CONNACKCODE[recvArr[3]], recvArr[3]);            // Connect status code message
                }
                break;

            case CTRLCODE.PINGRESP:                                                                                 // No need to handle, message response timer handles any timeout
                break;

            case CTRLCODE.PUBLISH:
                recvPublish(recvArr, payPtr);
                break;

            case CTRLCODE.PUBACK:
            case CTRLCODE.PUBREL:
            case CTRLCODE.PUBREC:
            case CTRLCODE.PUBCOMP:                                                                                  // Not supporting publish QoS > 0
                break;

            case CTRLCODE.SUBACK:
                // TODO: CHeck for packetID
                break;

            case CTRLCODE.UNSUBACK:
                // TODO: CHeck for packetID
                break;

            default:
                MQTTSessEnd("Invalid MQTT message received - code: " + recvArr[0], 97);
        }
    }

    // Extract topic and data from publish packet
    function recvPublish(recvArr, payPtr) {
        var arrPtr = 0;
        var packetID;
        var dup = recvArr[arrPtr] & 0x08;                                                                           // Duplicate publish, not used
        var QoS = (recvArr[arrPtr] & 0x06) >> 1;                                                                    // QoS not used
        var retain = recvArr[arrPtr] & 0x01;                                                                        // Retain set by server if the result of a new subscription sending stored state
        var topicLen = recvArr[payPtr] * 0xFF + recvArr[++payPtr];
        var topic = decodeUTF8(recvArr, ++payPtr, topicLen);
        if (net.QoS !== 0) {
            packetID = recvArr[++payPtr] * 0xFF + recvArr[++payPtr];
        }
        var data = decodeUTF8(recvArr, payPtr + topicLen, recvArr.length - payPtr - topicLen);
        sendParent(messageEvent, "MESSAGE", { topic: topic, data: data, retain: retain });
    }

    // Send a ping with period set by keepalive, only if no messages sent within ping period, message timeout timer will capture any net/server problems
    // BUG, if resetting the session we don't get the keepalive going
    function pingSend() {
        MQTTSend(CTRLCODE.PINGSEND, new Array());
    }

    // Handle message response timeouts
    function responseTimeout() {
        MQTTSessEnd("Timed out waiting for Server.", 97);
    }

    // Orderly shutdown of session layers
    function MQTTSessEnd(errStr, authStatus) {
        switch (net.netState) {
            case "SESSION":
                MQTTSend(CTRLCODE.DISCONNECT, new Array());                                                         // Disconnect MQTT session on server first
                net.netState = "WSCONNECTED";
                break;
            case "WSCONNECTED":
                break;
            case "ERROR":
                net.wsMQTT.close;
                net.netState = "DISCONNECTED";
        }

        clearInterval(net.keepAliveInterval);
        clearTimeout(net.msgTimer);

        if (net.netState === "DISCONNECTED") {
            sendParent(messageEvent, "WSERROR", errStr);
        } else {
            switch (authStatus) {
                case 0:
                    break;
                case 2:                                                                                                         // Server unavailable
                    sendParent(messageEvent, "MQTTREJECTED", errStr);
                    break;
                case 3:                                                                                                         // Server unavailable
                    sendParent(messageEvent, "UNAUTHORIZED", errStr);
                    break;
                case 4:                                                                                                         // bad username/password
                    sendParent(messageEvent, "UNAUTHORIZED", "Bad Username or Password supplied");
                    break;
                case 5:                                                                                                         // Unauthorised, assume token expired
                    sendParent(messageEvent, "TOKENEXPIRED", "Auto-logon expired. Please logon again.");
                    break;
                case 95:                                                                                                        // Network errors (note dropthru to case 96)
                    net.wsMQTT.close();
                    net.netState = "DISCONNECTED";
                case 96:                                                                                                        // Session reset or close
                    sendParent(messageEvent, "RESET", "Resetting session...");
                    break;
                case 97:                                                                                                        // Protocol error
                case 98:                                                                                                        // WS Close
                case 99:                                                                                                        // General error
                case 100:                                                                                                       // Network not starting
                default:
                    sendParent(messageEvent, "MQTTERROR", errStr);
            }
        }
    }

    function MQTTClose() {
        MQTTSessEnd("session logout", 96);
    }

    // Disconnect and reconnect (without delays)
    function MQTTReconnect() {
        MQTTServices(connectDetails.protocol, connectDetails.serverName, connectDetails.port);
        MQTTSessEnd("Session reset", 96);
    }

    // PacketID is unique 16 bit returned in MSB/LSB array
    function MQTTGetPacketID() {
        var packetID = [net.packetID >> 8, net.packetID & 0xFF];
        net.packetID++;
        if (net.packetID > 65535)
            packetID = 0;
        return packetID;
    }

    // Send MQTT payload array adding the fixed header.
    function MQTTSend(msgType, payload) {
        if (!Array.isArray(payload)) return false;

        var lenArr = new Array(1);                                                                                  // Encode length in MQTT format
        var numBytes = 0;
        var number = payload.length;
        do {
            var digit = number % 128;
            number = number >> 7;
            if (number > 0) {
                digit |= 0x80;
            }
            lenArr[numBytes++] = digit;                                                                             // if there are more data to encode, set the top bit of this byte
        } while (number > 0 && numBytes < 4);

        payload = lenArr.concat(payload);
        payload.unshift(msgType);

        try {
            if (net.wsMQTT.readyState !== net.wsMQTT.OPEN) {                                                        // Chrome won't catch send errors in the try/catch
                if (net.netState !== "DISCONNECTED") {
                    net.netState = "ERROR";
                }
                MQTTSessEnd("System error sending to server: WebSockets connection not open", 95);
                return false;
            }
            net.wsMQTT.send(new Uint8Array(payload));
        } catch (ex) {
            if (net.netState !== "DISCONNECTED") {
                net.netState = "ERROR";
            }
            MQTTSessEnd("System error sending to server: " + ex.toString(), 95);
            return false;
        }

        clearTimeout(net.msgTimer);                                                                                 // set timeout waiting for server response (none for disconnect)
        clearInterval(net.keepAliveInterval);

        if (msgType !== CTRLCODE.DISCONNECT) {
            if (msgType !== (CTRLCODE.PUBLISH | (net.QoS << 1) | (net.retain ? 0x01 : 0x00)))                       // Not expecting response from disconnect or publish QoS=0.
                net.msgTimer = setTimeout(responseTimeout, net.responseTimeout * 1000);
            if (net.KEEPALIVE > 0)
                net.keepAliveInterval = setInterval(pingSend, net.KEEPALIVE * 1000);                                // reset Ping keepalive period timer
        }
        return true;
    }

    // Payload array for MQTT UTF8 strings, [MSB, LSB length, expand UTF-8 to binary]
    function encodeUTF8(str, prepend) {
        var UTFArr = Array.from(encoder.encode(str));
        if (prepend) {                                                                                              // Only for MQTT fields encode, not data encode
            UTFArr.unshift(UTFArr.length & 0xFF);
            UTFArr.unshift(UTFArr.length >> 8);
        }
        return UTFArr;
    }

    // Decode UTF8 string in publish message
    function decodeUTF8(input, offset, length) {
        return decoder.decode(input.slice(offset, offset + length));
    }

    // Send to server via MQTT publish (must be in SensaData object format)
    function MQTTPublish(topic, data) {
        var payload = encodeUTF8(topic, true);
        if (net.QoS !== 0) {
            payload.push(MQTTGetPacketID());                                                                        // Add packetID for QoS > 0
        }
        if (typeof data === "string") {
            payload = payload.concat(encodeUTF8(data, false));                                                      // add processed data as array to payload array
            MQTTSend(CTRLCODE.PUBLISH | (net.QoS << 1) | (net.retain ? 0x01 : 0x00), payload);                      // Not supporting DUP.
            return true;
        } else {
            MQTTSessEnd("Data to send isn't a string - data type '" + typeof data + "' not sent. MQTT publish only accepts strings." + ex.toString(), 0);
            return false;
        }
    }

    // Subscribe to array of [topic]
    function MQTTSubscribe(topicArr) {
        if (!Array.isArray(topicArr) || topicArr.length === 0)
            return false;
        var payload = MQTTGetPacketID();
        for (var item in topicArr) {
            payload = payload.concat(encodeUTF8(topicArr[item], true));
            payload.push(net.QoS);
        }
        return MQTTSend(CTRLCODE.SUBSCRIBE, payload);
    }

    // Remove subscription(s) array [topic]
    function MQTTUnsubscribe(topicArr) {
        if (!Array.isArray(topicArr) || topicArr.length === 0)
            return false;
        var payload = MQTTGetPacketID();
        for (var item in topicArr) {
            payload = payload.concat(encodeUTF8(topicArr[item], true));
        }
        return MQTTSend(CTRLCODE.UNSUBSCRIBE, payload);
    }

    // public API
    return {
        publish: MQTTPublish,                                                                                       // MQTTPublish(topic, data)
        subscribe: MQTTSubscribe,                                                                                   // Subscribe to array of [topic]
        unsubscribe: MQTTUnsubscribe,                                                                               // Unsubscribe to array of [topic]
        connect: MQTTConnect,                                                                                       // Initiation MQTTconnection()
        reconnect: MQTTReconnect,                                                                                   // Reconnect() session immediately
        close: MQTTClose                                                                                            // Close session
    };
}

(() => {
  // js/vendor/osc.js/osc.js
  var osc = {};
  var osc = osc || {};
  (function() {
    "use strict";
    osc.SECS_70YRS = 2208988800;
    osc.TWO_32 = 4294967296;
    osc.defaults = {
      metadata: false,
      unpackSingleArgs: true
    };
    osc.isCommonJS = typeof module !== "undefined" && module.exports ? true : false;
    osc.isNode = osc.isCommonJS && typeof window === "undefined";
    osc.isElectron = typeof process !== "undefined" && process.versions && process.versions.electron ? true : false;
    osc.isBufferEnv = osc.isNode || osc.isElectron;
    osc.isArray = function(obj) {
      return obj && Object.prototype.toString.call(obj) === "[object Array]";
    };
    osc.isTypedArrayView = function(obj) {
      return obj.buffer && obj.buffer instanceof ArrayBuffer;
    };
    osc.isBuffer = function(obj) {
      return osc.isBufferEnv && obj instanceof Buffer;
    };
    osc.Long = typeof Long !== "undefined" ? Long : void 0;
    osc.TextDecoder = typeof TextDecoder !== "undefined" ? new TextDecoder("utf-8") : typeof util !== "undefined" && typeof (util.TextDecoder !== "undefined") ? new util.TextDecoder("utf-8") : void 0;
    osc.TextEncoder = typeof TextEncoder !== "undefined" ? new TextEncoder("utf-8") : typeof util !== "undefined" && typeof (util.TextEncoder !== "undefined") ? new util.TextEncoder("utf-8") : void 0;
    osc.dataView = function(obj, offset, length) {
      if (obj.buffer) {
        return new DataView(obj.buffer, offset, length);
      }
      if (obj instanceof ArrayBuffer) {
        return new DataView(obj, offset, length);
      }
      return new DataView(new Uint8Array(obj), offset, length);
    };
    osc.byteArray = function(obj) {
      if (obj instanceof Uint8Array) {
        return obj;
      }
      var buf = obj.buffer ? obj.buffer : obj;
      if (!(buf instanceof ArrayBuffer) && (typeof buf.length === "undefined" || typeof buf === "string")) {
        throw new Error("Can't wrap a non-array-like object as Uint8Array. Object was: " + JSON.stringify(obj, null, 2));
      }
      return new Uint8Array(buf);
    };
    osc.nativeBuffer = function(obj) {
      if (osc.isBufferEnv) {
        return osc.isBuffer(obj) ? obj : Buffer.from(obj.buffer ? obj : new Uint8Array(obj));
      }
      return osc.isTypedArrayView(obj) ? obj : new Uint8Array(obj);
    };
    osc.copyByteArray = function(source, target, offset) {
      if (osc.isTypedArrayView(source) && osc.isTypedArrayView(target)) {
        target.set(source, offset);
      } else {
        var start = offset === void 0 ? 0 : offset, len = Math.min(target.length - offset, source.length);
        for (var i = 0, j = start; i < len; i++, j++) {
          target[j] = source[i];
        }
      }
      return target;
    };
    osc.readString = function(dv, offsetState) {
      var charCodes = [], idx = offsetState.idx;
      for (; idx < dv.byteLength; idx++) {
        var charCode = dv.getUint8(idx);
        if (charCode !== 0) {
          charCodes.push(charCode);
        } else {
          idx++;
          break;
        }
      }
      idx = idx + 3 & ~3;
      offsetState.idx = idx;
      var decoder = osc.isBufferEnv ? osc.readString.withBuffer : osc.TextDecoder ? osc.readString.withTextDecoder : osc.readString.raw;
      return decoder(charCodes);
    };
    osc.readString.raw = function(charCodes) {
      var str = "";
      var sliceSize = 1e4;
      for (var i = 0; i < charCodes.length; i += sliceSize) {
        str += String.fromCharCode.apply(null, charCodes.slice(i, i + sliceSize));
      }
      return str;
    };
    osc.readString.withTextDecoder = function(charCodes) {
      var data = new Int8Array(charCodes);
      return osc.TextDecoder.decode(data);
    };
    osc.readString.withBuffer = function(charCodes) {
      return Buffer.from(charCodes).toString("utf-8");
    };
    osc.writeString = function(str) {
      var encoder = osc.isBufferEnv ? osc.writeString.withBuffer : osc.TextEncoder ? osc.writeString.withTextEncoder : null, terminated = str + "\0", encodedStr;
      if (encoder) {
        encodedStr = encoder(terminated);
      }
      var len = encoder ? encodedStr.length : terminated.length, paddedLen = len + 3 & ~3, arr = new Uint8Array(paddedLen);
      for (var i = 0; i < len - 1; i++) {
        var charCode = encoder ? encodedStr[i] : terminated.charCodeAt(i);
        arr[i] = charCode;
      }
      return arr;
    };
    osc.writeString.withTextEncoder = function(str) {
      return osc.TextEncoder.encode(str);
    };
    osc.writeString.withBuffer = function(str) {
      return Buffer.from(str);
    };
    osc.readPrimitive = function(dv, readerName, numBytes, offsetState) {
      var val = dv[readerName](offsetState.idx, false);
      offsetState.idx += numBytes;
      return val;
    };
    osc.writePrimitive = function(val, dv, writerName, numBytes, offset) {
      offset = offset === void 0 ? 0 : offset;
      var arr;
      if (!dv) {
        arr = new Uint8Array(numBytes);
        dv = new DataView(arr.buffer);
      } else {
        arr = new Uint8Array(dv.buffer);
      }
      dv[writerName](offset, val, false);
      return arr;
    };
    osc.readInt32 = function(dv, offsetState) {
      return osc.readPrimitive(dv, "getInt32", 4, offsetState);
    };
    osc.writeInt32 = function(val, dv, offset) {
      return osc.writePrimitive(val, dv, "setInt32", 4, offset);
    };
    osc.readInt64 = function(dv, offsetState) {
      var high = osc.readPrimitive(dv, "getInt32", 4, offsetState), low = osc.readPrimitive(dv, "getInt32", 4, offsetState);
      if (osc.Long) {
        return new osc.Long(low, high);
      } else {
        return {
          high,
          low,
          unsigned: false
        };
      }
    };
    osc.writeInt64 = function(val, dv, offset) {
      var arr = new Uint8Array(8);
      arr.set(osc.writePrimitive(val.high, dv, "setInt32", 4, offset), 0);
      arr.set(osc.writePrimitive(val.low, dv, "setInt32", 4, offset + 4), 4);
      return arr;
    };
    osc.readFloat32 = function(dv, offsetState) {
      return osc.readPrimitive(dv, "getFloat32", 4, offsetState);
    };
    osc.writeFloat32 = function(val, dv, offset) {
      return osc.writePrimitive(val, dv, "setFloat32", 4, offset);
    };
    osc.readFloat64 = function(dv, offsetState) {
      return osc.readPrimitive(dv, "getFloat64", 8, offsetState);
    };
    osc.writeFloat64 = function(val, dv, offset) {
      return osc.writePrimitive(val, dv, "setFloat64", 8, offset);
    };
    osc.readChar32 = function(dv, offsetState) {
      var charCode = osc.readPrimitive(dv, "getUint32", 4, offsetState);
      return String.fromCharCode(charCode);
    };
    osc.writeChar32 = function(str, dv, offset) {
      var charCode = str.charCodeAt(0);
      if (charCode === void 0 || charCode < -1) {
        return void 0;
      }
      return osc.writePrimitive(charCode, dv, "setUint32", 4, offset);
    };
    osc.readBlob = function(dv, offsetState) {
      var len = osc.readInt32(dv, offsetState), paddedLen = len + 3 & ~3, blob = new Uint8Array(dv.buffer, offsetState.idx, len);
      offsetState.idx += paddedLen;
      return blob;
    };
    osc.writeBlob = function(data) {
      data = osc.byteArray(data);
      var len = data.byteLength, paddedLen = len + 3 & ~3, offset = 4, blobLen = paddedLen + offset, arr = new Uint8Array(blobLen), dv = new DataView(arr.buffer);
      osc.writeInt32(len, dv);
      arr.set(data, offset);
      return arr;
    };
    osc.readMIDIBytes = function(dv, offsetState) {
      var midi = new Uint8Array(dv.buffer, offsetState.idx, 4);
      offsetState.idx += 4;
      return midi;
    };
    osc.writeMIDIBytes = function(bytes) {
      bytes = osc.byteArray(bytes);
      var arr = new Uint8Array(4);
      arr.set(bytes);
      return arr;
    };
    osc.readColor = function(dv, offsetState) {
      var bytes = new Uint8Array(dv.buffer, offsetState.idx, 4), alpha = bytes[3] / 255;
      offsetState.idx += 4;
      return {
        r: bytes[0],
        g: bytes[1],
        b: bytes[2],
        a: alpha
      };
    };
    osc.writeColor = function(color) {
      var alpha = Math.round(color.a * 255), arr = new Uint8Array([color.r, color.g, color.b, alpha]);
      return arr;
    };
    osc.readTrue = function() {
      return true;
    };
    osc.readFalse = function() {
      return false;
    };
    osc.readNull = function() {
      return null;
    };
    osc.readImpulse = function() {
      return 1;
    };
    osc.readTimeTag = function(dv, offsetState) {
      var secs1900 = osc.readPrimitive(dv, "getUint32", 4, offsetState), frac = osc.readPrimitive(dv, "getUint32", 4, offsetState), native = secs1900 === 0 && frac === 1 ? Date.now() : osc.ntpToJSTime(secs1900, frac);
      return {
        raw: [secs1900, frac],
        native
      };
    };
    osc.writeTimeTag = function(timeTag) {
      var raw = timeTag.raw ? timeTag.raw : osc.jsToNTPTime(timeTag.native), arr = new Uint8Array(8), dv = new DataView(arr.buffer);
      osc.writeInt32(raw[0], dv, 0);
      osc.writeInt32(raw[1], dv, 4);
      return arr;
    };
    osc.timeTag = function(secs, now) {
      secs = secs || 0;
      now = now || Date.now();
      var nowSecs = now / 1e3, nowWhole = Math.floor(nowSecs), nowFracs = nowSecs - nowWhole, secsWhole = Math.floor(secs), secsFracs = secs - secsWhole, fracs = nowFracs + secsFracs;
      if (fracs > 1) {
        var fracsWhole = Math.floor(fracs), fracsFracs = fracs - fracsWhole;
        secsWhole += fracsWhole;
        fracs = fracsFracs;
      }
      var ntpSecs = nowWhole + secsWhole + osc.SECS_70YRS, ntpFracs = Math.round(osc.TWO_32 * fracs);
      return {
        raw: [ntpSecs, ntpFracs]
      };
    };
    osc.ntpToJSTime = function(secs1900, frac) {
      var secs1970 = secs1900 - osc.SECS_70YRS, decimals = frac / osc.TWO_32, msTime = (secs1970 + decimals) * 1e3;
      return msTime;
    };
    osc.jsToNTPTime = function(jsTime) {
      var secs = jsTime / 1e3, secsWhole = Math.floor(secs), secsFrac = secs - secsWhole, ntpSecs = secsWhole + osc.SECS_70YRS, ntpFracs = Math.round(osc.TWO_32 * secsFrac);
      return [ntpSecs, ntpFracs];
    };
    osc.readArguments = function(dv, options, offsetState) {
      var typeTagString = osc.readString(dv, offsetState);
      if (typeTagString.indexOf(",") !== 0) {
        throw new Error("A malformed type tag string was found while reading the arguments of an OSC message. String was: " + typeTagString, " at offset: " + offsetState.idx);
      }
      var argTypes = typeTagString.substring(1).split(""), args = [];
      osc.readArgumentsIntoArray(args, argTypes, typeTagString, dv, options, offsetState);
      return args;
    };
    osc.readArgument = function(argType, typeTagString, dv, options, offsetState) {
      var typeSpec = osc.argumentTypes[argType];
      if (!typeSpec) {
        throw new Error("'" + argType + "' is not a valid OSC type tag. Type tag string was: " + typeTagString);
      }
      var argReader = typeSpec.reader, arg = osc[argReader](dv, offsetState);
      if (options.metadata) {
        arg = {
          type: argType,
          value: arg
        };
      }
      return arg;
    };
    osc.readArgumentsIntoArray = function(arr, argTypes, typeTagString, dv, options, offsetState) {
      var i = 0;
      while (i < argTypes.length) {
        var argType = argTypes[i], arg;
        if (argType === "[") {
          var fromArrayOpen = argTypes.slice(i + 1), endArrayIdx = fromArrayOpen.indexOf("]");
          if (endArrayIdx < 0) {
            throw new Error("Invalid argument type tag: an open array type tag ('[') was found without a matching close array tag ('[]'). Type tag was: " + typeTagString);
          }
          var typesInArray = fromArrayOpen.slice(0, endArrayIdx);
          arg = osc.readArgumentsIntoArray([], typesInArray, typeTagString, dv, options, offsetState);
          i += endArrayIdx + 2;
        } else {
          arg = osc.readArgument(argType, typeTagString, dv, options, offsetState);
          i++;
        }
        arr.push(arg);
      }
      return arr;
    };
    osc.writeArguments = function(args, options) {
      var argCollection = osc.collectArguments(args, options);
      return osc.joinParts(argCollection);
    };
    osc.joinParts = function(dataCollection) {
      var buf = new Uint8Array(dataCollection.byteLength), parts = dataCollection.parts, offset = 0;
      for (var i = 0; i < parts.length; i++) {
        var part = parts[i];
        osc.copyByteArray(part, buf, offset);
        offset += part.length;
      }
      return buf;
    };
    osc.addDataPart = function(dataPart, dataCollection) {
      dataCollection.parts.push(dataPart);
      dataCollection.byteLength += dataPart.length;
    };
    osc.writeArrayArguments = function(args, dataCollection) {
      var typeTag = "[";
      for (var i = 0; i < args.length; i++) {
        var arg = args[i];
        typeTag += osc.writeArgument(arg, dataCollection);
      }
      typeTag += "]";
      return typeTag;
    };
    osc.writeArgument = function(arg, dataCollection) {
      if (osc.isArray(arg)) {
        return osc.writeArrayArguments(arg, dataCollection);
      }
      var type = arg.type, writer = osc.argumentTypes[type].writer;
      if (writer) {
        var data = osc[writer](arg.value);
        osc.addDataPart(data, dataCollection);
      }
      return arg.type;
    };
    osc.collectArguments = function(args, options, dataCollection) {
      if (!osc.isArray(args)) {
        args = typeof args === "undefined" ? [] : [args];
      }
      dataCollection = dataCollection || {
        byteLength: 0,
        parts: []
      };
      if (!options.metadata) {
        args = osc.annotateArguments(args);
      }
      var typeTagString = ",", currPartIdx = dataCollection.parts.length;
      for (var i = 0; i < args.length; i++) {
        var arg = args[i];
        typeTagString += osc.writeArgument(arg, dataCollection);
      }
      var typeData = osc.writeString(typeTagString);
      dataCollection.byteLength += typeData.byteLength;
      dataCollection.parts.splice(currPartIdx, 0, typeData);
      return dataCollection;
    };
    osc.readMessage = function(data, options, offsetState) {
      options = options || osc.defaults;
      var dv = osc.dataView(data, data.byteOffset, data.byteLength);
      offsetState = offsetState || {
        idx: 0
      };
      var address = osc.readString(dv, offsetState);
      return osc.readMessageContents(address, dv, options, offsetState);
    };
    osc.readMessageContents = function(address, dv, options, offsetState) {
      if (address.indexOf("/") !== 0) {
        throw new Error("A malformed OSC address was found while reading an OSC message. String was: " + address);
      }
      var args = osc.readArguments(dv, options, offsetState);
      return {
        address,
        args: args.length === 1 && options.unpackSingleArgs ? args[0] : args
      };
    };
    osc.collectMessageParts = function(msg, options, dataCollection) {
      dataCollection = dataCollection || {
        byteLength: 0,
        parts: []
      };
      osc.addDataPart(osc.writeString(msg.address), dataCollection);
      return osc.collectArguments(msg.args, options, dataCollection);
    };
    osc.writeMessage = function(msg, options) {
      options = options || osc.defaults;
      if (!osc.isValidMessage(msg)) {
        throw new Error("An OSC message must contain a valid address. Message was: " + JSON.stringify(msg, null, 2));
      }
      var msgCollection = osc.collectMessageParts(msg, options);
      return osc.joinParts(msgCollection);
    };
    osc.isValidMessage = function(msg) {
      return msg.address && msg.address.indexOf("/") === 0;
    };
    osc.readBundle = function(dv, options, offsetState) {
      return osc.readPacket(dv, options, offsetState);
    };
    osc.collectBundlePackets = function(bundle, options, dataCollection) {
      dataCollection = dataCollection || {
        byteLength: 0,
        parts: []
      };
      osc.addDataPart(osc.writeString("#bundle"), dataCollection);
      osc.addDataPart(osc.writeTimeTag(bundle.timeTag), dataCollection);
      for (var i = 0; i < bundle.packets.length; i++) {
        var packet = bundle.packets[i], collector = packet.address ? osc.collectMessageParts : osc.collectBundlePackets, packetCollection = collector(packet, options);
        dataCollection.byteLength += packetCollection.byteLength;
        osc.addDataPart(osc.writeInt32(packetCollection.byteLength), dataCollection);
        dataCollection.parts = dataCollection.parts.concat(packetCollection.parts);
      }
      return dataCollection;
    };
    osc.writeBundle = function(bundle, options) {
      if (!osc.isValidBundle(bundle)) {
        throw new Error("An OSC bundle must contain 'timeTag' and 'packets' properties. Bundle was: " + JSON.stringify(bundle, null, 2));
      }
      options = options || osc.defaults;
      var bundleCollection = osc.collectBundlePackets(bundle, options);
      return osc.joinParts(bundleCollection);
    };
    osc.isValidBundle = function(bundle) {
      return bundle.timeTag !== void 0 && bundle.packets !== void 0;
    };
    osc.readBundleContents = function(dv, options, offsetState, len) {
      var timeTag = osc.readTimeTag(dv, offsetState), packets = [];
      while (offsetState.idx < len) {
        var packetSize = osc.readInt32(dv, offsetState), packetLen = offsetState.idx + packetSize, packet = osc.readPacket(dv, options, offsetState, packetLen);
        packets.push(packet);
      }
      return {
        timeTag,
        packets
      };
    };
    osc.readPacket = function(data, options, offsetState, len) {
      var dv = osc.dataView(data, data.byteOffset, data.byteLength);
      len = len === void 0 ? dv.byteLength : len;
      offsetState = offsetState || {
        idx: 0
      };
      var header = osc.readString(dv, offsetState), firstChar = header[0];
      if (firstChar === "#") {
        return osc.readBundleContents(dv, options, offsetState, len);
      } else if (firstChar === "/") {
        return osc.readMessageContents(header, dv, options, offsetState);
      }
      throw new Error("The header of an OSC packet didn't contain an OSC address or a #bundle string. Header was: " + header);
    };
    osc.writePacket = function(packet, options) {
      if (osc.isValidMessage(packet)) {
        return osc.writeMessage(packet, options);
      } else if (osc.isValidBundle(packet)) {
        return osc.writeBundle(packet, options);
      } else {
        throw new Error("The specified packet was not recognized as a valid OSC message or bundle. Packet was: " + JSON.stringify(packet, null, 2));
      }
    };
    osc.argumentTypes = {
      i: {
        reader: "readInt32",
        writer: "writeInt32"
      },
      h: {
        reader: "readInt64",
        writer: "writeInt64"
      },
      f: {
        reader: "readFloat32",
        writer: "writeFloat32"
      },
      s: {
        reader: "readString",
        writer: "writeString"
      },
      S: {
        reader: "readString",
        writer: "writeString"
      },
      b: {
        reader: "readBlob",
        writer: "writeBlob"
      },
      t: {
        reader: "readTimeTag",
        writer: "writeTimeTag"
      },
      T: {
        reader: "readTrue"
      },
      F: {
        reader: "readFalse"
      },
      N: {
        reader: "readNull"
      },
      I: {
        reader: "readImpulse"
      },
      d: {
        reader: "readFloat64",
        writer: "writeFloat64"
      },
      c: {
        reader: "readChar32",
        writer: "writeChar32"
      },
      r: {
        reader: "readColor",
        writer: "writeColor"
      },
      m: {
        reader: "readMIDIBytes",
        writer: "writeMIDIBytes"
      }
      // [] are special cased within read/writeArguments()
    };
    osc.inferTypeForArgument = function(arg) {
      var type = typeof arg;
      switch (type) {
        case "boolean":
          return arg ? "T" : "F";
        case "string":
          return "s";
        case "number":
          return "f";
        case "undefined":
          return "N";
        case "object":
          if (arg === null) {
            return "N";
          } else if (arg instanceof Uint8Array || arg instanceof ArrayBuffer) {
            return "b";
          } else if (typeof arg.high === "number" && typeof arg.low === "number") {
            return "h";
          }
          break;
      }
      throw new Error("Can't infer OSC argument type for value: " + JSON.stringify(arg, null, 2));
    };
    osc.annotateArguments = function(args) {
      var annotated = [];
      for (var i = 0; i < args.length; i++) {
        var arg = args[i], msgArg;
        if (typeof arg === "object" && arg.type && arg.value !== void 0) {
          msgArg = arg;
        } else if (osc.isArray(arg)) {
          msgArg = osc.annotateArguments(arg);
        } else {
          var oscType = osc.inferTypeForArgument(arg);
          msgArg = {
            type: oscType,
            value: arg
          };
        }
        annotated.push(msgArg);
      }
      return annotated;
    };
    ;
  })();
  var EventEmitter = function() {
  };
  EventEmitter.prototype.on = function() {
  };
  EventEmitter.prototype.emit = function() {
  };
  EventEmitter.prototype.removeListener = function() {
  };
  (function() {
    "use strict";
    osc.supportsSerial = false;
    osc.firePacketEvents = function(port, packet, timeTag, packetInfo) {
      if (packet.address) {
        port.emit("message", packet, timeTag, packetInfo);
      } else {
        osc.fireBundleEvents(port, packet, timeTag, packetInfo);
      }
    };
    osc.fireBundleEvents = function(port, bundle, timeTag, packetInfo) {
      port.emit("bundle", bundle, timeTag, packetInfo);
      for (var i = 0; i < bundle.packets.length; i++) {
        var packet = bundle.packets[i];
        osc.firePacketEvents(port, packet, bundle.timeTag, packetInfo);
      }
    };
    osc.fireClosedPortSendError = function(port, msg) {
      msg = msg || "Can't send packets on a closed osc.Port object. Please open (or reopen) this Port by calling open().";
      port.emit("error", msg);
    };
    osc.Port = function(options) {
      this.options = options || {};
      this.on("data", this.decodeOSC.bind(this));
    };
    var p = osc.Port.prototype = Object.create(EventEmitter.prototype);
    p.constructor = osc.Port;
    p.send = function(oscPacket) {
      var args = Array.prototype.slice.call(arguments), encoded = this.encodeOSC(oscPacket), buf = osc.nativeBuffer(encoded);
      args[0] = buf;
      this.sendRaw.apply(this, args);
    };
    p.encodeOSC = function(packet) {
      packet = packet.buffer ? packet.buffer : packet;
      var encoded;
      try {
        encoded = osc.writePacket(packet, this.options);
      } catch (err) {
        this.emit("error", err);
      }
      return encoded;
    };
    p.decodeOSC = function(data, packetInfo) {
      data = osc.byteArray(data);
      this.emit("raw", data, packetInfo);
      try {
        var packet = osc.readPacket(data, this.options);
        this.emit("osc", packet, packetInfo);
        osc.firePacketEvents(this, packet, void 0, packetInfo);
      } catch (err) {
        this.emit("error", err);
      }
    };
    osc.SLIPPort = function(options) {
      var that = this;
      var o = this.options = options || {};
      o.useSLIP = o.useSLIP === void 0 ? true : o.useSLIP;
      this.decoder = new slip.Decoder({
        onMessage: this.decodeOSC.bind(this),
        onError: function(err) {
          that.emit("error", err);
        }
      });
      var decodeHandler = o.useSLIP ? this.decodeSLIPData : this.decodeOSC;
      this.on("data", decodeHandler.bind(this));
    };
    p = osc.SLIPPort.prototype = Object.create(osc.Port.prototype);
    p.constructor = osc.SLIPPort;
    p.encodeOSC = function(packet) {
      packet = packet.buffer ? packet.buffer : packet;
      var framed;
      try {
        var encoded = osc.writePacket(packet, this.options);
        framed = slip.encode(encoded);
      } catch (err) {
        this.emit("error", err);
      }
      return framed;
    };
    p.decodeSLIPData = function(data, packetInfo) {
      this.decoder.decode(data, packetInfo);
    };
    osc.relay = function(from, to, eventName, sendFnName, transformFn, sendArgs) {
      eventName = eventName || "message";
      sendFnName = sendFnName || "send";
      transformFn = transformFn || function() {
      };
      sendArgs = sendArgs ? [null].concat(sendArgs) : [];
      var listener = function(data) {
        sendArgs[0] = data;
        data = transformFn(data);
        to[sendFnName].apply(to, sendArgs);
      };
      from.on(eventName, listener);
      return {
        eventName,
        listener
      };
    };
    osc.relayPorts = function(from, to, o) {
      var eventName = o.raw ? "raw" : "osc", sendFnName = o.raw ? "sendRaw" : "send";
      return osc.relay(from, to, eventName, sendFnName, o.transform);
    };
    osc.stopRelaying = function(from, relaySpec) {
      from.removeListener(relaySpec.eventName, relaySpec.listener);
    };
    osc.Relay = function(port1, port2, options) {
      var o = this.options = options || {};
      o.raw = false;
      this.port1 = port1;
      this.port2 = port2;
      this.listen();
    };
    p = osc.Relay.prototype = Object.create(EventEmitter.prototype);
    p.constructor = osc.Relay;
    p.open = function() {
      this.port1.open();
      this.port2.open();
    };
    p.listen = function() {
      if (this.port1Spec && this.port2Spec) {
        this.close();
      }
      this.port1Spec = osc.relayPorts(this.port1, this.port2, this.options);
      this.port2Spec = osc.relayPorts(this.port2, this.port1, this.options);
      var closeListener = this.close.bind(this);
      this.port1.on("close", closeListener);
      this.port2.on("close", closeListener);
    };
    p.close = function() {
      osc.stopRelaying(this.port1, this.port1Spec);
      osc.stopRelaying(this.port2, this.port2Spec);
      this.emit("close", this.port1, this.port2);
    };
  })();
  (function() {
    "use strict";
    osc.WebSocket = typeof WebSocket !== "undefined" ? WebSocket : void 0;
    osc.WebSocketPort = function(options) {
      osc.Port.call(this, options);
      this.on("open", this.listen.bind(this));
      this.socket = options.socket;
      if (this.socket) {
        if (this.socket.readyState === 1) {
          osc.WebSocketPort.setupSocketForBinary(this.socket);
          this.emit("open", this.socket);
        } else {
          this.open();
        }
      }
    };
    var p = osc.WebSocketPort.prototype = Object.create(osc.Port.prototype);
    p.constructor = osc.WebSocketPort;
    p.open = function() {
      if (!this.socket || this.socket.readyState > 1) {
        this.socket = new osc.WebSocket(this.options.url);
      }
      osc.WebSocketPort.setupSocketForBinary(this.socket);
      var that = this;
      this.socket.onopen = function() {
        that.emit("open", that.socket);
      };
      this.socket.onerror = function(err) {
        that.emit("error", err);
      };
    };
    p.listen = function() {
      var that = this;
      this.socket.onmessage = function(e) {
        that.emit("data", e.data, e);
      };
      this.socket.onclose = function(e) {
        that.emit("close", e);
      };
      that.emit("ready");
    };
    p.sendRaw = function(encoded) {
      if (!this.socket || this.socket.readyState !== 1) {
        osc.fireClosedPortSendError(this);
        return;
      }
      this.socket.send(encoded);
    };
    p.close = function(code, reason) {
      this.socket.close(code, reason);
    };
    osc.WebSocketPort.setupSocketForBinary = function(socket) {
      socket.binaryType = osc.isNode ? "nodebuffer" : "arraybuffer";
    };
  })();
  var { readPacket, writePacket, readMessage, writeMessage, readBundle, writeBundle } = osc;

  // js/lib/metrics_offsets.js
  var PRESCHEDULER_PENDING = 6;
  var PRESCHEDULER_PEAK = 7;
  var PRESCHEDULER_SENT = 8;
  var RETRIES_SUCCEEDED = 9;
  var RETRIES_FAILED = 10;
  var BUNDLES_SCHEDULED = 11;
  var TOTAL_DISPATCHES = 13;
  var RETRY_QUEUE_SIZE = 15;

  // js/lib/ring_buffer_core.js
  function calculateAvailableSpace(head, tail, bufferSize) {
    return (bufferSize - 1 - head + tail) % bufferSize;
  }
  function writeMessageToBuffer({
    uint8View: uint8View2,
    dataView: dataView2,
    bufferStart,
    bufferSize,
    head,
    payload,
    sequence,
    messageMagic,
    headerSize
  }) {
    const payloadSize = payload.length;
    const totalSize = headerSize + payloadSize;
    const alignedSize = totalSize + 3 & ~3;
    const spaceToEnd = bufferSize - head;
    if (alignedSize > spaceToEnd) {
      const headerBytes = new Uint8Array(headerSize);
      const headerView = new DataView(headerBytes.buffer);
      headerView.setUint32(0, messageMagic, true);
      headerView.setUint32(4, alignedSize, true);
      headerView.setUint32(8, sequence, true);
      headerView.setUint32(12, 0, true);
      const writePos1 = bufferStart + head;
      const writePos2 = bufferStart;
      if (spaceToEnd >= headerSize) {
        uint8View2.set(headerBytes, writePos1);
        const payloadBytesInFirstPart = spaceToEnd - headerSize;
        if (payloadBytesInFirstPart > 0) {
          uint8View2.set(payload.subarray(0, payloadBytesInFirstPart), writePos1 + headerSize);
        }
        uint8View2.set(payload.subarray(payloadBytesInFirstPart), writePos2);
      } else {
        uint8View2.set(headerBytes.subarray(0, spaceToEnd), writePos1);
        uint8View2.set(headerBytes.subarray(spaceToEnd), writePos2);
        const payloadOffset = headerSize - spaceToEnd;
        uint8View2.set(payload, writePos2 + payloadOffset);
      }
    } else {
      const writePos = bufferStart + head;
      dataView2.setUint32(writePos, messageMagic, true);
      dataView2.setUint32(writePos + 4, alignedSize, true);
      dataView2.setUint32(writePos + 8, sequence, true);
      dataView2.setUint32(writePos + 12, 0, true);
      uint8View2.set(payload, writePos + headerSize);
    }
    return (head + alignedSize) % bufferSize;
  }
  function readMessagesFromBuffer({
    uint8View: uint8View2,
    dataView: dataView2,
    bufferStart,
    bufferSize,
    head,
    tail,
    messageMagic,
    paddingMagic,
    headerSize,
    maxMessages = Infinity,
    onMessage,
    onCorruption
  }) {
    let currentTail = tail;
    let messagesRead = 0;
    while (currentTail !== head && messagesRead < maxMessages) {
      const bytesToEnd = bufferSize - currentTail;
      if (bytesToEnd < headerSize) {
        currentTail = 0;
        continue;
      }
      const readPos = bufferStart + currentTail;
      const magic = dataView2.getUint32(readPos, true);
      if (magic === paddingMagic) {
        currentTail = 0;
        continue;
      }
      if (magic !== messageMagic) {
        if (onCorruption) {
          onCorruption(currentTail);
        }
        currentTail = (currentTail + 1) % bufferSize;
        continue;
      }
      const length = dataView2.getUint32(readPos + 4, true);
      const sequence = dataView2.getUint32(readPos + 8, true);
      if (length < headerSize || length > bufferSize) {
        if (onCorruption) {
          onCorruption(currentTail);
        }
        currentTail = (currentTail + 1) % bufferSize;
        continue;
      }
      const payloadLength = length - headerSize;
      const payloadStart = readPos + headerSize;
      const payload = new Uint8Array(payloadLength);
      for (let i = 0; i < payloadLength; i++) {
        payload[i] = uint8View2[payloadStart + i];
      }
      onMessage(payload, sequence, length);
      currentTail = (currentTail + length) % bufferSize;
      messagesRead++;
    }
    return { newTail: currentTail, messagesRead };
  }

  // js/lib/ring_buffer_writer.js
  function tryAcquireLock(atomicView2, lockIndex, maxSpins = 0) {
    for (let i = 0; i <= maxSpins; i++) {
      const oldValue = Atomics.compareExchange(atomicView2, lockIndex, 0, 1);
      if (oldValue === 0) {
        return true;
      }
    }
    return false;
  }
  function releaseLock(atomicView2, lockIndex) {
    Atomics.store(atomicView2, lockIndex, 0);
  }
  function writeToRingBuffer({
    atomicView: atomicView2,
    dataView: dataView2,
    uint8View: uint8View2,
    bufferConstants: bufferConstants2,
    ringBufferBase: ringBufferBase2,
    controlIndices,
    oscMessage,
    maxSpins = 0
  }) {
    const payloadSize = oscMessage.length;
    const totalSize = bufferConstants2.MESSAGE_HEADER_SIZE + payloadSize;
    if (totalSize > bufferConstants2.IN_BUFFER_SIZE - bufferConstants2.MESSAGE_HEADER_SIZE) {
      return false;
    }
    if (!tryAcquireLock(atomicView2, controlIndices.IN_WRITE_LOCK, maxSpins)) {
      return false;
    }
    try {
      const head = Atomics.load(atomicView2, controlIndices.IN_HEAD);
      const tail = Atomics.load(atomicView2, controlIndices.IN_TAIL);
      const alignedSize = totalSize + 3 & ~3;
      const available = calculateAvailableSpace(head, tail, bufferConstants2.IN_BUFFER_SIZE);
      if (available < alignedSize) {
        return false;
      }
      const messageSeq = Atomics.add(atomicView2, controlIndices.IN_SEQUENCE, 1);
      const newHead = writeMessageToBuffer({
        uint8View: uint8View2,
        dataView: dataView2,
        bufferStart: ringBufferBase2 + bufferConstants2.IN_BUFFER_START,
        bufferSize: bufferConstants2.IN_BUFFER_SIZE,
        head,
        payload: oscMessage,
        sequence: messageSeq,
        messageMagic: bufferConstants2.MESSAGE_MAGIC,
        headerSize: bufferConstants2.MESSAGE_HEADER_SIZE
      });
      Atomics.load(atomicView2, controlIndices.IN_HEAD);
      Atomics.store(atomicView2, controlIndices.IN_HEAD, newHead);
      return true;
    } finally {
      releaseLock(atomicView2, controlIndices.IN_WRITE_LOCK);
    }
  }

  // js/workers/supersonic_worker.js
  var mode = "postMessage";
  var workletPort = null;
  var sharedBuffer = null;
  var ringBufferBase = null;
  var bufferConstants = null;
  var atomicView = null;
  var dataView = null;
  var uint8View = null;
  var CONTROL_INDICES = {};
  var metricsView = null;
  var config = {};
  var initialized = false;
  var eventHeap = [];
  var sequenceCounter = 0;
  var periodicTimer = null;
  var isDispatching = false;
  var retryQueue = [];
  var MAX_RETRIES_PER_MESSAGE = 5;
  var maxPendingMessages = 65536;
  var NTP_EPOCH_OFFSET = 2208988800;
  var POLL_INTERVAL_MS = 25;
  var LOOKAHEAD_S = 0.2;
  var log = (...args) => {
    if (true) {
      console.log("[SuperSonicWorker]", ...args);
    }
  };
  var logError = (...args) => {
    console.error("[SuperSonicWorker]", ...args);
  };
  var metricsStore = (offset, value) => {
    if (!metricsView) return;
    if (mode === "sab") {
      Atomics.store(metricsView, offset, value);
    } else {
      metricsView[offset] = value;
    }
  };
  var metricsLoad = (offset) => {
    if (!metricsView) return 0;
    if (mode === "sab") {
      return Atomics.load(metricsView, offset);
    } else {
      return metricsView[offset];
    }
  };
  var metricsAdd = (offset, value) => {
    if (!metricsView) return;
    if (mode === "sab") {
      Atomics.add(metricsView, offset, value);
    } else {
      metricsView[offset] += value;
    }
  };
  var getCurrentNTP = () => {
    const perfTimeMs = performance.timeOrigin + performance.now();
    return perfTimeMs / 1e3 + NTP_EPOCH_OFFSET;
  };
  var extractNTPFromBundle = (oscData) => {
    if (oscData.length >= 16 && oscData[0] === 35) {
      const view = new DataView(oscData.buffer, oscData.byteOffset);
      const ntpSeconds = view.getUint32(8, false);
      const ntpFraction = view.getUint32(12, false);
      return ntpSeconds + ntpFraction / 4294967296;
    }
    return null;
  };
  var isImmediateBundle = (oscData) => {
    if (oscData.length < 16 || oscData[0] !== 35) return true;
    const view = new DataView(oscData.buffer, oscData.byteOffset);
    const ntpSeconds = view.getUint32(8, false);
    const ntpFraction = view.getUint32(12, false);
    return ntpSeconds === 0 && (ntpFraction === 0 || ntpFraction === 1);
  };
  var initSharedBuffer = () => {
    if (!sharedBuffer || !bufferConstants) {
      log("Cannot init SAB - missing buffer or constants");
      return;
    }
    atomicView = new Int32Array(sharedBuffer);
    dataView = new DataView(sharedBuffer);
    uint8View = new Uint8Array(sharedBuffer);
    CONTROL_INDICES = {
      IN_HEAD: (ringBufferBase + bufferConstants.CONTROL_START + 0) / 4,
      IN_TAIL: (ringBufferBase + bufferConstants.CONTROL_START + 4) / 4,
      OUT_HEAD: (ringBufferBase + bufferConstants.CONTROL_START + 8) / 4,
      OUT_TAIL: (ringBufferBase + bufferConstants.CONTROL_START + 12) / 4,
      IN_SEQUENCE: (ringBufferBase + bufferConstants.CONTROL_START + 24) / 4,
      IN_WRITE_LOCK: (ringBufferBase + bufferConstants.CONTROL_START + 40) / 4
    };
    const metricsBase = ringBufferBase + bufferConstants.METRICS_START;
    metricsView = new Uint32Array(sharedBuffer, metricsBase, bufferConstants.METRICS_SIZE / 4);
    log("SAB ring buffer initialized");
  };
  var heapPush = (event) => {
    eventHeap.push(event);
    siftUp(eventHeap.length - 1);
  };
  var heapPeek = () => eventHeap.length > 0 ? eventHeap[0] : null;
  var heapPop = () => {
    if (eventHeap.length === 0) return null;
    const top = eventHeap[0];
    const last = eventHeap.pop();
    if (eventHeap.length > 0) {
      eventHeap[0] = last;
      siftDown(0);
    }
    return top;
  };
  var siftUp = (index) => {
    while (index > 0) {
      const parent = Math.floor((index - 1) / 2);
      if (compareEvents(eventHeap[index], eventHeap[parent]) >= 0) break;
      swap(index, parent);
      index = parent;
    }
  };
  var siftDown = (index) => {
    const length = eventHeap.length;
    while (true) {
      const left = 2 * index + 1;
      const right = 2 * index + 2;
      let smallest = index;
      if (left < length && compareEvents(eventHeap[left], eventHeap[smallest]) < 0) {
        smallest = left;
      }
      if (right < length && compareEvents(eventHeap[right], eventHeap[smallest]) < 0) {
        smallest = right;
      }
      if (smallest === index) break;
      swap(index, smallest);
      index = smallest;
    }
  };
  var compareEvents = (a, b) => {
    if (a.ntpTime === b.ntpTime) return a.seq - b.seq;
    return a.ntpTime - b.ntpTime;
  };
  var swap = (i, j) => {
    const tmp = eventHeap[i];
    eventHeap[i] = eventHeap[j];
    eventHeap[j] = tmp;
  };
  var dispatchOSCMessage = (oscMessage, isRetry = false) => {
    if (mode === "postMessage") {
      if (!workletPort) {
        logError("Cannot dispatch - worklet port not connected");
        return false;
      }
      workletPort.postMessage({ type: "osc", oscData: oscMessage });
      metricsAdd(PRESCHEDULER_SENT, 1);
      return true;
    }
    if (!sharedBuffer || !atomicView) {
      logError("SAB not initialized for ring buffer writing");
      return false;
    }
    const payloadSize = oscMessage.length;
    const totalSize = bufferConstants.MESSAGE_HEADER_SIZE + payloadSize;
    if (totalSize > bufferConstants.IN_BUFFER_SIZE - bufferConstants.MESSAGE_HEADER_SIZE) {
      logError("Message too large:", totalSize);
      return false;
    }
    const success = writeToRingBuffer({
      atomicView,
      dataView,
      uint8View,
      bufferConstants,
      ringBufferBase,
      controlIndices: CONTROL_INDICES,
      oscMessage,
      maxSpins: 10
    });
    if (!success) {
      if (!isRetry) {
        log("Ring buffer full, queuing for retry");
      }
      return false;
    }
    metricsAdd(PRESCHEDULER_SENT, 1);
    return true;
  };
  var queueForRetry = (oscData, context) => {
    const totalPending = eventHeap.length + retryQueue.length;
    if (totalPending >= maxPendingMessages) {
      logError("Backpressure: dropping retry (" + totalPending + " pending)");
      metricsAdd(RETRIES_FAILED, 1);
      return;
    }
    retryQueue.push({
      oscData,
      retryCount: 0,
      context: context || "unknown",
      queuedAt: performance.now()
    });
    metricsStore(RETRY_QUEUE_SIZE, retryQueue.length);
  };
  var processRetryQueue = () => {
    if (retryQueue.length === 0) return;
    let i = 0;
    while (i < retryQueue.length) {
      const item = retryQueue[i];
      const success = dispatchOSCMessage(item.oscData, true);
      if (success) {
        retryQueue.splice(i, 1);
        metricsAdd(RETRIES_SUCCEEDED, 1);
        metricsStore(RETRY_QUEUE_SIZE, retryQueue.length);
      } else {
        item.retryCount++;
        if (item.retryCount >= MAX_RETRIES_PER_MESSAGE) {
          logError("Dropped message after", MAX_RETRIES_PER_MESSAGE, "retries:", item.context);
          retryQueue.splice(i, 1);
          metricsAdd(RETRIES_FAILED, 1);
          metricsStore(RETRY_QUEUE_SIZE, retryQueue.length);
          self.postMessage({ type: "error", error: "Ring buffer full - dropped message" });
        } else {
          i++;
        }
      }
    }
  };
  var scheduleEvent = (oscData, sessionId, runTag) => {
    const totalPending = eventHeap.length + retryQueue.length;
    if (totalPending >= maxPendingMessages) {
      logError("Backpressure: rejecting message (" + totalPending + " pending)");
      return false;
    }
    const ntpTime = extractNTPFromBundle(oscData);
    if (ntpTime === null || isImmediateBundle(oscData)) {
      const success = dispatchOSCMessage(oscData, false);
      if (!success) {
        queueForRetry(oscData, "immediate message");
      }
      return true;
    }
    const currentNTP = getCurrentNTP();
    const timeUntilExec = ntpTime - currentNTP;
    if (timeUntilExec <= LOOKAHEAD_S) {
      const success = dispatchOSCMessage(oscData, false);
      if (!success) {
        queueForRetry(oscData, "near-future bundle");
      }
      metricsAdd(TOTAL_DISPATCHES, 1);
      return true;
    }
    const event = {
      ntpTime,
      seq: sequenceCounter++,
      sessionId: sessionId || 0,
      runTag: runTag || "",
      oscData
    };
    heapPush(event);
    metricsAdd(BUNDLES_SCHEDULED, 1);
    metricsStore(PRESCHEDULER_PENDING, eventHeap.length);
    const peak = metricsLoad(PRESCHEDULER_PEAK);
    if (eventHeap.length > peak) {
      metricsStore(PRESCHEDULER_PEAK, eventHeap.length);
    }
    return true;
  };
  var checkAndDispatch = () => {
    isDispatching = true;
    if (mode === "sab") {
      readOscReplies();
    }
    processRetryQueue();
    const currentNTP = getCurrentNTP();
    const lookaheadTime = currentNTP + LOOKAHEAD_S;
    while (eventHeap.length > 0) {
      const nextEvent = heapPeek();
      if (nextEvent.ntpTime <= lookaheadTime) {
        heapPop();
        metricsStore(PRESCHEDULER_PENDING, eventHeap.length);
        metricsAdd(TOTAL_DISPATCHES, 1);
        const success = dispatchOSCMessage(nextEvent.oscData, false);
        if (!success) {
          queueForRetry(nextEvent.oscData, "scheduled bundle");
        }
      } else {
        break;
      }
    }
    isDispatching = false;
    periodicTimer = setTimeout(checkAndDispatch, POLL_INTERVAL_MS);
  };
  var startPeriodicPolling = () => {
    if (periodicTimer !== null) return;
    log("Starting periodic polling");
    checkAndDispatch();
  };
  var stopPeriodicPolling = () => {
    if (periodicTimer !== null) {
      clearTimeout(periodicTimer);
      periodicTimer = null;
    }
  };
  var readOscReplies = () => {
    if (mode !== "sab" || !atomicView || !bufferConstants) {
      return;
    }
    const head = Atomics.load(atomicView, CONTROL_INDICES.OUT_HEAD);
    const tail = Atomics.load(atomicView, CONTROL_INDICES.OUT_TAIL);
    if (head === tail) return;
    const messages = [];
    const { newTail, messagesRead } = readMessagesFromBuffer({
      uint8View,
      dataView,
      bufferStart: ringBufferBase + bufferConstants.OUT_BUFFER_START,
      bufferSize: bufferConstants.OUT_BUFFER_SIZE,
      head,
      tail,
      messageMagic: bufferConstants.MESSAGE_MAGIC,
      paddingMagic: bufferConstants.PADDING_MAGIC,
      headerSize: bufferConstants.MESSAGE_HEADER_SIZE,
      onMessage: (payload, sequence) => {
        const buffer = payload.buffer.slice(
          payload.byteOffset,
          payload.byteOffset + payload.byteLength
        );
        messages.push({ oscData: buffer, sequence });
      }
    });
    if (messagesRead > 0) {
      Atomics.store(atomicView, CONTROL_INDICES.OUT_TAIL, newTail);
    }
    if (messages.length > 0) {
      for (const msg of messages) {
        self.postMessage({
          type: "osc",
          data: msg.oscData,
          sequence: msg.sequence
        }, [msg.oscData]);
      }
    }
  };
  var cancelBySessionTag = (sessionId, runTag) => {
    const before = eventHeap.length;
    eventHeap = eventHeap.filter((e) => !(e.sessionId === sessionId && e.runTag === runTag));
    rebuildHeap();
    metricsStore(PRESCHEDULER_PENDING, eventHeap.length);
    log("Cancelled", before - eventHeap.length, "events for session", sessionId, "tag", runTag);
  };
  var cancelBySession = (sessionId) => {
    const before = eventHeap.length;
    eventHeap = eventHeap.filter((e) => e.sessionId !== sessionId);
    rebuildHeap();
    metricsStore(PRESCHEDULER_PENDING, eventHeap.length);
    log("Cancelled", before - eventHeap.length, "events for session", sessionId);
  };
  var cancelByTag = (runTag) => {
    const before = eventHeap.length;
    eventHeap = eventHeap.filter((e) => e.runTag !== runTag);
    rebuildHeap();
    metricsStore(PRESCHEDULER_PENDING, eventHeap.length);
    log("Cancelled", before - eventHeap.length, "events for tag", runTag);
  };
  var cancelAll = () => {
    const count = eventHeap.length;
    eventHeap = [];
    retryQueue = [];
    metricsStore(PRESCHEDULER_PENDING, 0);
    metricsStore(RETRY_QUEUE_SIZE, 0);
    log("Cancelled all", count, "scheduled events");
  };
  var rebuildHeap = () => {
    for (let i = Math.floor(eventHeap.length / 2) - 1; i >= 0; i--) {
      siftDown(i);
    }
  };
  var setupWorkletPort = (port) => {
    workletPort = port;
    workletPort.onmessage = (event) => {
      const { data } = event;
      handleWorkletMessage(data);
    };
    workletPort.start();
    log("Worklet port connected");
  };
  var handleWorkletMessage = (data) => {
    switch (data.type) {
      case "initialized":
        if (data.bufferConstants) {
          bufferConstants = data.bufferConstants;
          ringBufferBase = data.ringBufferBase ?? 0;
          if (mode === "sab" && sharedBuffer) {
            initSharedBuffer();
          }
          startPeriodicPolling();
        }
        self.postMessage({
          type: "worklet:initialized",
          success: data.success,
          bufferConstants: data.bufferConstants,
          ringBufferBase: data.ringBufferBase,
          exports: data.exports,
          initialSnapshot: data.initialSnapshot,
          error: data.error
        });
        break;
      case "oscReplies":
        if (data.messages) {
          for (const msg of data.messages) {
            self.postMessage({
              type: "osc",
              data: msg.oscData,
              sequence: msg.sequence
            });
          }
        }
        break;
      case "debugRawBatch":
        self.postMessage({
          type: "debug",
          messages: data.messages
        });
        break;
      case "snapshot":
        self.postMessage({
          type: "snapshot",
          buffer: data.buffer,
          snapshotsSent: data.snapshotsSent
        }, data.buffer ? [data.buffer] : []);
        break;
      case "bufferCopied":
        self.postMessage({
          type: "bufferCopied",
          copyId: data.copyId,
          success: data.success,
          error: data.error
        });
        break;
      case "version":
        self.postMessage({
          type: "version",
          version: data.version
        });
        break;
      case "timeOffset":
        self.postMessage({
          type: "timeOffset",
          offset: data.offset
        });
        break;
      case "metricsSnapshot":
        self.postMessage({
          type: "metricsSnapshot",
          requestId: data.requestId,
          metrics: data.metrics
        });
        break;
      case "error":
        self.postMessage({
          type: "error",
          error: data.error
        });
        break;
      default:
        log("Unknown worklet message type:", data.type);
    }
  };
  var routeOSC = async (oscData, sessionId, runTag) => {
    if (!initialized) {
      logError("Cannot route OSC - not initialized");
      return;
    }
    const uint8Data = oscData instanceof Uint8Array ? oscData : new Uint8Array(oscData);
    scheduleEvent(uint8Data, sessionId, runTag);
  };
  var handleInit = async (data) => {
    log("Initializing...", { mode: data.mode });
    mode = data.mode || "postMessage";
    config = {
      sampleBaseURL: data.sampleBaseURL,
      preschedulerCapacity: data.preschedulerCapacity || 65536,
      snapshotIntervalMs: data.snapshotIntervalMs ?? 25,
      bufferPoolConfig: data.bufferPoolConfig
    };
    if (mode === "sab" && data.sharedBuffer) {
      sharedBuffer = data.sharedBuffer;
    }
    if (data.workletPort) {
      setupWorkletPort(data.workletPort);
    } else {
      logError("No worklet port provided in init");
      self.postMessage({
        type: "error",
        error: "No worklet port provided"
      });
      return;
    }
    workletPort.postMessage({
      type: "init",
      mode,
      sharedBuffer,
      snapshotIntervalMs: config.snapshotIntervalMs
    });
    initialized = true;
    log("Initialized in", mode, "mode");
    self.postMessage({ type: "ready" });
  };
  var handleLoadWasm = (data) => {
    if (!workletPort) {
      logError("Cannot load WASM - worklet port not connected");
      return;
    }
    workletPort.postMessage({
      type: "loadWasm",
      wasmBytes: data.wasmBytes,
      worldOptions: data.worldOptions,
      sampleRate: data.sampleRate,
      wasmMemory: data.wasmMemory,
      memoryPages: data.memoryPages
    });
  };
  var handleOSC = async (data) => {
    if (!initialized) {
      logError("Cannot route OSC - not initialized");
      return;
    }
    await routeOSC(data.data, data.sessionId, data.runTag);
  };
  var handleControl = (type, data) => {
    if (!workletPort) {
      logError("Cannot send control message - worklet port not connected");
      return;
    }
    workletPort.postMessage({ type, ...data });
  };
  var handleCopyBufferData = (data) => {
    if (!workletPort) {
      logError("Cannot copy buffer data - worklet port not connected");
      return;
    }
    workletPort.postMessage({
      type: "copyBufferData",
      copyId: data.copyId,
      ptr: data.ptr,
      data: data.data
    }, [data.data]);
  };
  self.onmessage = async (event) => {
    const { data } = event;
    switch (data.type) {
      case "init":
        await handleInit(data);
        break;
      case "loadWasm":
        handleLoadWasm(data);
        break;
      case "osc":
        await handleOSC(data);
        break;
      case "copyBufferData":
        handleCopyBufferData(data);
        break;
      // Control messages - forward to worklet
      case "getVersion":
      case "getTimeOffset":
      case "getMetrics":
      case "setGlobalOffset":
        handleControl(data.type, data);
        break;
      case "setNTPStartTime":
        handleControl("setNTPStartTime", { ntpStartTime: data.ntpStartTime });
        break;
      // Cancellation messages
      case "cancelTag":
        cancelByTag(data.runTag);
        break;
      case "cancelSession":
        cancelBySession(data.sessionId);
        break;
      case "cancelSessionTag":
        cancelBySessionTag(data.sessionId, data.runTag);
        break;
      case "cancelAll":
        cancelAll();
        break;
      case "shutdown":
        log("Shutting down");
        stopPeriodicPolling();
        cancelAll();
        initialized = false;
        break;
      default:
        log("Unknown message type:", data.type);
    }
  };
  log("Worker loaded");
})();
/*! osc.js 2.4.5, Copyright 2024 Colin Clark | github.com/colinbdclark/osc.js */

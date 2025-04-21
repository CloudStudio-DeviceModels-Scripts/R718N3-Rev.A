function parseUplink(device, payload) {
    var payloadb = payload.asBytes();
    var decoded = Decoder(payloadb, payload.port)
    env.log(decoded);

    // Store Current 1
    if (decoded.currentma1 != null) {
        var c1 = device.endpoints.byAddress("1");

        if (c1 != null)
            c1.UpdateCurrentSensorStatus(decoded.currentma1);

        // Store Current 2
        if (decoded.currentma2 != null) {
            var c2 = device.endpoints.byAddress("2");

            if (c2 != null)
                c2.UpdateCurrentSensorStatus(decoded.currentma2);

            // Store Current 3
            if (decoded.currentma3 != null) {
                var c3 = device.endpoints.byAddress("3");

                if (c3 != null)
                    c3.UpdateCurrentSensorStatus(decoded.currentma3);

            }
        }


        function Decoder(bytes, fport) {
            var decoded = {};
            if (fport === 6) { // then its ReportDataCmd
                if (bytes[2] === 0x00) { // version report
                    decoded.devicetype = "ALL";
                    decoded.softwareversion = bytes[3];
                    decoded.hardwareversion = bytes[4];
                    decoded.datecode = bcdtonumber(bytes.slice(5, 9));

                } else if ((bytes[1] === 0x4A) && (bytes[2] === 0x01)) { // device type 4A (R718N3) and report type 01
                    decoded.devicetype = "R718N3-1";
                    // full data is split over two separate uplink messages
                    decoded.battery = bytes[3] / 10;
                    decoded.currentma1 = ((bytes[4] << 8) + bytes[5]);
                    decoded.currentma2 = ((bytes[6] << 8) + bytes[7]);
                    decoded.currentma3 = ((bytes[8] << 8) + bytes[9]);
                    decoded.multiplier1 = bytes[10];
                    return decoded;
                } else if ((bytes[1] === 0x4A) && (bytes[2] === 0x02)) { // device type 4A (R718N3) and report type 02
                    decoded.devicetype = "R718N3-2";
                    // full data is split over two separate uplink messages
                    decoded.battery = bytes[3] / 10;
                    decoded.multiplier2 = bytes[4];
                    decoded.multiplier3 = bytes[5];
                    return decoded;
                }
            } else if (fport === 7) { // then its a ConfigureCmd response
                if ((bytes[0] === 0x82) && (bytes[1] === 0x01)) { // R711 or R712
                    decoded.mintime = ((bytes[2] << 8) + bytes[3]);
                    decoded.maxtime = ((bytes[4] << 8) + bytes[5]);
                    decoded.battchange = bytes[6] / 10;
                    decoded.tempchange = ((bytes[7] << 8) + bytes[8]) / 100;
                    decoded.humidchange = ((bytes[9] << 8) + bytes[10]) / 100;
                } else if ((bytes[0] === 0x81) && (bytes[1] === 0x01)) { // R711 or R712
                    decoded.success = bytes[2];
                }
            }
            return decoded;
        }

        function bcdtonumber(bytes) {
            var num = 0;
            var m = 1;
            var i;
            for (i = 0; i < bytes.length; i++) {
                num += (bytes[bytes.length - 1 - i] & 0x0F) * m;
                num += ((bytes[bytes.length - 1 - i] >> 4) & 0x0F) * m * 10;
                m *= 100;
            }
            return num;
        }

        function bytestofloat16(bytes) {
            var sign = (bytes & 0x8000) ? -1 : 1;
            var exponent = ((bytes >> 7) & 0xFF) - 127;
            var significand = (bytes & ~(-1 << 7));

            if (exponent == 128)
                return 0.0;

            if (exponent == -127) {
                if (significand == 0) return sign * 0.0;
                exponent = -126;
                significand /= (1 << 6);
            } else significand = (significand | (1 << 7)) / (1 << 7);

            return sign * significand * Math.pow(2, exponent);
        }


    }

}

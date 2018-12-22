const
    bos = require('bos'),
    BosDeserializeBuffer = bos.BosDeserializeBuffer,
    net = require('net');


const listenHost = '127.0.0.1';
const listenPort = 3000;

const outHost = 'zcoin.mintpond.com';
const outPort = 3000;

const server = net.createServer({allowHalfOpen: false}, function newConnectionHandler(inSocket) {

    const inBuffer = new BosDeserializeBuffer(225000);
    const outBuffer = new BosDeserializeBuffer(1024);

    const outSocket = net.connect(outPort, outHost, function () {

        const inBosOutput = [];

        const outBosOutput = [];

        inSocket.on('data', function (d) {

            outSocket.write(d);
            inBuffer.append(d);

            if (inBuffer.deserialize(inBosOutput)) {

                inBosOutput.forEach(function (obj) {
                    if (obj.method === 'mining.submit') {
                        obj.mtpProof = '---';
                        obj.mtpBlock = '---';
                    }
                });

                console.log('>> ' + JSON.stringify(inBosOutput));
            }
            inBosOutput.length = 0;
        });

        inSocket.on('error', function (err) {
            console.error('inSocket error: ' + err);
        });

        inSocket.on('close', function () {
            console.log('inSocket closed');
            outSocket.end();
        });

        outSocket.on('error', function (err) {
            console.error('outSocket error: ' + err);
        });

        outSocket.on('close', function () {
            console.log('outSocket closed');
            inSocket.end();
        });

        outSocket.on('data', function (d) {

            outBuffer.append(d);

            if (outBuffer.deserialize(outBosOutput)) {

                outBosOutput.forEach(function (obj) {
                    inSocket.write(bos.serialize(obj));
                });

                console.log('<< ' + JSON.stringify(outBosOutput));
            }

            outBosOutput.length = 0;
        });
    });
});

server.listen({
    host: listenHost,
    port: listenPort
}, function serverListeningCallback() {
    console.log('listening on ' + listenHost + ':' + listenPort);
});
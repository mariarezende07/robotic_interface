const WebSocket = require("ws");
const getLocalIpAddress = require("./ipUtils.js");

const wss = new WebSocket.Server({ port: 9000 });
const ESP_SECRET_ID = "meu_segredinho";
let espClient = null;

console.log(wss.address());

const ip_address = getLocalIpAddress();
if (ip_address) {
  console.log(`WebSocket server is running at ${ip_address}:9000`);
} else {
  console.log("Unable to determine the local IP address");
}

wss.on("connection", (ws, req) => {
  console.log("Received a New Connection");
  if (req.headers.authorization == ESP_SECRET_ID) {
    espClient = ws;
    console.log("Esp connected with ip " + req.socket.remoteAddress);

    espClient.on("close", (reasonCode, description)=>{
      console.log("ESP CAUI");
      console.log(reasonCode);
      console.log(description.toString());
      espClient = null;
    })

    espClient.on("error", (error)=>{
      console.log("ESP CAUI");
      console.log(error);
      espClient = null;
    })

    return;
  }

  ws.on("message", (message) => {
    parsed_angles = parse_angles_message(message);

    console.log(parsed_angles);
    if (espClient != null) {
      espClient.send(message);
    }
  });

  ws.on("close", () => {
    console.log("Client disconnected");
    client = null;
  });
});

function parse_angles_message(message) {
  return {
    servo_0: message.readUInt16LE(0),
    servo_1: message.readUInt16LE(2),
    servo_2: message.readUInt16LE(4),
    servo_3: message.readUInt16LE(6),
    servo_4: message.readUInt16LE(8),
    claw: message.readUInt16LE(10),
  };
}

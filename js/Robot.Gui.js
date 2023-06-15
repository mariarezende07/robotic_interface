define((require, exports, module) => {
  const gui = require("UiDat");
  const storeManager = require("State");
  const robotStore = require("Robot");

  const geometry = storeManager.getStore("Robot").getState().geometry;
  const jointLimits = storeManager.getStore("Robot").getState().jointLimits;

  const robotGuiStore = storeManager.createStore("RobotGui", {});

  const DEG_TO_RAD = Math.PI / 180;
  const RAD_TO_DEG = 180 / Math.PI;
  /* DAT GUI */

  const geometryGui = gui.addFolder("robot geometry");

  for (const link in geometry) {
    if (link) {
      const linkFolder = geometryGui.addFolder(`link ${link}`);
      for (const axis in geometry[link]) {
        if (axis) {
          gui.remember(geometry[link]);
          linkFolder
            .add(geometry[link], axis)
            .min(-10)
            .max(10)
            .step(0.1)
            .onChange(() => {
              robotStore.dispatch("ROBOT_CHANGE_GEOMETRY", geometry);
            });
        }
      }
    }
  }
  
  const clawGui = gui.addFolder("Claw movement");
  clawGui.open();
  let clawState = false;
  clawGui.domElement.addEventListener("click", () => {
    
    clawState = !clawState;
    console.log(clawState);
  });

  

  const anglesDeg = {
    A0: 0,
    A1: 0,
    A2: 0,
    A3: 0,
    A4: 0,
    A5: 0,
  };

  const anglesDegScaled = {
    A0: 0,
    A1: 0,
    A2: 0,
    A3: 0,
    A4: 0,
    A5: 0,
  };

  const configuration = {
    1: false,
    2: false,
    3: false,
  };

  const jointLimitsDeg = {
    J0: [-190, 190],
    J1: [-58, 90],
    J2: [-135, 40],
    J3: [-90, 75],
    J4: [-139, 20],
    J5: [-188, 181],
  };
  function mapAngleToScale(angle) {
    // Ensure the angle is within the range of 0 to 360 degrees
    angle = angle % 360;

    // Map the angle to the scale of 0 to 999
    var mappedValue = Math.floor((angle / 360) * 1000);
    mappedValue = (mappedValue + 1000) % 1000;

    return mappedValue + 1000;
  }

  robotStore.listen([(state) => state.angles], (angles) => {
    Object.keys(anglesDeg).forEach((k) => {
      anglesDeg[k] = (angles[k] / Math.PI) * 180;
      anglesDegScaled[k] = mapAngleToScale(anglesDeg[k]);
    });
  });

  const anglesGui = gui.addFolder("angles");
  let i = 0;
  for (const key in anglesDeg) {
    anglesGui
      .add(anglesDeg, key)
      .min(jointLimits[`J${i}`][0] * RAD_TO_DEG)
      .max(jointLimits[`J${i++}`][1] * RAD_TO_DEG)
      .step(1)
      .listen()
      .onChange(() => {
        const anglesRad = {};
        for (const key in anglesDeg) {
          if (anglesDeg.hasOwnProperty(key)) {
            anglesRad[key] = anglesDeg[key] * DEG_TO_RAD;
          }
        }
        robotStore.dispatch("ROBOT_CHANGE_ANGLES", anglesRad);
      });
  }

  const configurationGui = gui.addFolder("configuration");
  for (const key in configuration) {
    configurationGui
      .add(configuration, key)
      .listen()
      .onChange(() => {
        robotStore.dispatch(
          "ROBOT_CHANGE_CONFIGURATION",
          Object.values(configuration)
        );
      });
  }

  const angleLimitGui = anglesGui.addFolder("angle limits");
  for (const joint in jointLimitsDeg) {
    if (joint) {
      const jointFolder = angleLimitGui.addFolder(`joint ${joint}`);
      for (const limit in jointLimitsDeg[joint]) {
        if (limit) {
          // gui.remember(jointLimitsDeg[joint])

          ((j) =>
            jointFolder
              .add(jointLimitsDeg[j], limit)
              .name(limit == 0 ? "min" : "max")
              .min(-360)
              .max(360)
              .step(1)
              .onChange(() => {
                limts_rad = {};
                limts_rad[j] = [
                  jointLimitsDeg[j][0] * DEG_TO_RAD,
                  jointLimitsDeg[j][1] * DEG_TO_RAD,
                ];
                robotStore.dispatch("ROBOT_CHANGE_JOINT_LIMITS", limts_rad);
              }))(joint);
        }
      }
    }
  }
  /*  START WEB SOCKET */
  const web_socket_server = new WebSocket("ws://192.168.15.6:9000/");
  console.log("ANGLES DEGREE SCALED", anglesDegScaled);
  function send_angles_message(anglesDegScaled) {
    const message_buffer = new ArrayBuffer(12);
    const message = new Uint16Array(message_buffer);
    message[0] = anglesDegScaled.A0;
    message[1] = anglesDegScaled.A1;
    message[2] = anglesDegScaled.A2;
    message[3] = anglesDegScaled.A3;
    message[4] = anglesDegScaled.A4;
    message[5] = anglesDegScaled.A5;

    web_socket_server.send(message);
  }

  web_socket_server.onopen = (event) => {
    console.log("Stablished a connection sucessfuly");
    setInterval(() => {
      send_angles_message(anglesDegScaled);
    }, 200);
  };

  /* END DAT GUI */

  module.exports = robotStore;
});

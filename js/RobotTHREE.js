define((require, exports, module) => {
  const storeManager = require('State')
  const { scene } = require('THREEScene')
  const robotStore = require('Robot')

  const THREESimulationRobot = new THREE.Group()
  scene.add(THREESimulationRobot)

  const robotTHREEStore = storeManager.createStore('RobotTHREE', {})

  let VisualRobot
  robotStore.listen([state => state.geometry, state => state.jointLimits], (geometry, jointLimits) => {
    buildRobot({ geometry, jointLimits }) // after GUI loaded in the stored values
  })

  const cacheState = {
    jointOutOfBound: [false, false, false, false, false, false],
  }
  robotStore.listen((state) => {
    const angles = Object.values(state.angles)
    VisualRobot.setAngles(angles)

    for (let i = 0; i < 6; i++) { // do some caching
      if (!cacheState.jointOutOfBound[i] && state.jointOutOfBound[i]) { // highlight only on change
        VisualRobot.highlightJoint(i, 0xff0000)
      } else if (cacheState.jointOutOfBound[i] && !state.jointOutOfBound[i]) {
        VisualRobot.highlightJoint(i)
      }
    }

    cacheState.jointOutOfBound = state.jointOutOfBound
  })

  function buildRobot(state) {
    

    while (THREESimulationRobot.children.length) {
      THREESimulationRobot.remove(THREESimulationRobot.children[0])
    }
    // object to nested arrays
    const geometry = Object.values(state.geometry).map((val, i, array) => [val.x, val.y, val.z])
    const jointLimits = Object.values(state.jointLimits)

    VisualRobot = new THREERobot(geometry, jointLimits, THREESimulationRobot)
  }


  module.exports = robotStore
})

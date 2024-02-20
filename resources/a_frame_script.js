// Componentes generales

/**
 * Componente para garantizar que la escena usa el espacio de color correcto
 */
AFRAME.registerComponent("escena", {
  loadedAssetCount: 0,
  totalAssetCount: 0,

  init: function () {
    let aRenderer = this.el.renderer;
    aRenderer.antialias = true;
    aRenderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    aRenderer.outputEncoding = THREE.sRGBEncoding;
  },
});

/**
 * Componente para asignar las texturas a la señal con la que interactua el usuario para obtener la información de la práctica
 * e iniciar la aplicación para la inspección de los productos
 */
AFRAME.registerComponent("info-sign", {
  init: function () {
    let el = this.el;
    el.addEventListener("loaded", (e) => {
      let tree3D = el.getObject3D("mesh");
      let signTexture;
      let signAlphaTexture;
      const textureLoader = new THREE.TextureLoader();
      if (el.id == "taskSign") {
        signTexture = textureLoader.load("resources/Textures/Office_Scene/Task_icon.png");
        signAlphaTexture = textureLoader.load("resources/Textures/Office_Scene/Task_icon_alpha.png");
      } else {
        signTexture = textureLoader.load("resources/Textures/Outdoors_Scene/Chat_icon.png");
        signAlphaTexture = textureLoader.load("resources/Textures/Outdoors_Scene/Chat_icon_alpha.png");
      }
      signTexture.encoding = THREE.sRGBEncoding;
      const signMaterial = new THREE.MeshBasicMaterial();
      signMaterial.map = signTexture;
      signMaterial.alphaMap = signAlphaTexture;
      signMaterial.transparent = true;
      signMaterial.side = THREE.DoubleSide;
      if (!tree3D) {
        return;
      }
      tree3D.traverse(function (node) {
        if (node.isMesh) {
          node.material = signMaterial;
        }
      });
    });
    el.addEventListener("mouseenter", function () {
      el.setAttribute("scale", { x: 1.1, y: 1.1, z: 1.1 });
    });
    el.addEventListener("mouseleave", function () {
      el.setAttribute("scale", { x: 1, y: 1, z: 1 });
    });
  },
});

/**
 * Componente para asignar las texturas al simbolo de alerta de las señales.
 */
AFRAME.registerComponent("alert", {
  init: function () {
    let el = this.el;
    el.addEventListener("loaded", (e) => {
      let tree3D = el.getObject3D("mesh");
      let alertTexture;
      let alertAlphaTexture;
      const textureLoader = new THREE.TextureLoader();
      alertTexture = textureLoader.load("resources/Textures/Outdoors_Scene/Alert_icon.png");
      alertAlphaTexture = textureLoader.load("resources/Textures/Outdoors_Scene/Alert_icon_alpha.png");
      alertTexture.encoding = THREE.sRGBEncoding;
      const alertMaterial = new THREE.MeshBasicMaterial();
      alertMaterial.map = alertTexture;
      alertMaterial.alphaMap = alertAlphaTexture;
      alertMaterial.alphaTest = 0.6;
      alertMaterial.transparent = true;
      alertMaterial.side = THREE.DoubleSide;
      if (!tree3D) {
        return;
      }
      tree3D.traverse(function (node) {
        if (node.isMesh) {
          node.material = alertMaterial;
        }
      });
    });
  },
});

/**
 * Componente para asignar la textura de sombra a los camiones
 */
AFRAME.registerComponent("truck_shadow", {
  init: function () {
    let el = this.el;
    el.addEventListener("loaded", (e) => {
      let tree3D = el.getObject3D("mesh");
      let shadowTexture;
      const textureLoader = new THREE.TextureLoader();
      shadowTexture = textureLoader.load(
        "resources/Textures/Outdoors_Scene/camion_sombra.png"
      );
      shadowTexture.encoding = THREE.sRGBEncoding;
      const shadowMaterial = new THREE.MeshBasicMaterial();
      // shadowMaterial.color = 0xffffff
      shadowMaterial.map = shadowTexture;
      shadowMaterial.transparent = true;
      shadowMaterial.side = THREE.DoubleSide;
      if (!tree3D) {
        return;
      }
      tree3D.traverse(function (node) {
        if (node.isMesh) {
          node.material = shadowMaterial;
        }
      });
    });
  },
});

/**
 * Componente para permitir que el usuario se desplace por el entorno en tercera persona
 */
AFRAME.registerComponent("player_controls", {
  schema: {
    /*
            Default key assignments: WASDQERFTG. 
            (Pronounced: "wahz-dee-kerf-tig")
            WASD: standard forward/left/backward/right movement
            Mnemonics:
            QE: turn left/right (positioned above move left/right keys)
            RF: move up/down ("R"ise / "F"all)
            TG: look up/down (look at "T"ower / "G"round.
        */
    moveForwardKey: { type: "string", default: "W" },
    moveBackwardKey: { type: "string", default: "S" },
    turnLeftKey: { type: "string", default: "A" },
    turnRightKey: { type: "string", default: "D" },

    flyEnabled: { type: "boolean", default: true },
    turnEnabled: { type: "boolean", default: true },

    moveSpeed: { type: "number", default: 5 }, // A-Frame units/second
    turnSpeed: { type: "number", default: 30 }, // degrees/second

    // use keyboard or other (e.g. joystick) to activate these controls
    inputType: { type: "string", default: "keyboard" },
  },

  convertKeyName: function (keyName) {
    if (keyName == " ") return "Space";
    else if (keyName.length == 1) return keyName.toUpperCase();
    else return keyName;
  },

  registerKeyDown: function (keyName) {
    // avoid adding duplicates of keys
    if (!this.keyPressedSet.has(keyName)) this.keyPressedSet.add(keyName);
  },

  registerKeyUp: function (keyName) {
    this.keyPressedSet.delete(keyName);
  },

  isKeyPressed: function (keyName) {
    return this.keyPressedSet.has(keyName);
  },

  init: function () {
    // register key down/up events
    //  and keep track of all keys currently pressed
    this.keyPressedSet = new Set();

    let self = this;

    document.addEventListener("keydown", function (eventData) {
      self.registerKeyDown(self.convertKeyName(eventData.key));
    });

    document.addEventListener("keyup", function (eventData) {
      self.registerKeyUp(self.convertKeyName(eventData.key));
    });

    // movement-related data

    this.moveVector = new THREE.Vector3(0, 0, 0);
    this.movePercent = new THREE.Vector3(0, 0, 0);
    // z = forward/backward
    // x = left/right
    // y = up/down

    this.rotateVector = new THREE.Vector2(0, 0);
    this.rotatePercent = new THREE.Vector2(0, 0);
    // y = turn angle
    // x = look angle

    // used as reference vector when turning
    this.upVector = new THREE.Vector3(0, 1, 0);

    // current rotation amounts
    this.turnAngle = 0; // around global Y axis
    this.lookAngle = 0; // around local X axis

    // this will = null or an object
    this.lookControls = this.el.components["look-controls"];

    // allows easy extraction of turn angle
    this.el.object3D.rotation.order = "YXZ";
  },

  tick: function (time, timeDelta) {
    let moveAmount = (timeDelta / 1000) * this.data.moveSpeed;
    // need to convert angle measures from degrees to radians
    let turnAmount =
      (timeDelta / 1000) * THREE.Math.degToRad(this.data.turnSpeed);

    // rotations

    // reset values
    let totalTurnAngle = 0;

    // look-controls and extended-wasd-controls are compatible
    //   with desktop/mouse combo but not for tablet/gyroscope combo ("magic window" effect)
    //   (at least not with this code)
    // thus, look/turn automatically disabled when look-controls present

    if (this.lookControls) {
      // take into account look-controls, if they exist
      // this code is only useful when trying to combine
      //   look-controls with extended-wasd rotation
      // totalTurnAngle += this.lookControls.yawObject.rotation.y;
      // totalLookAngle += this.lookControls.pitchObject.rotation.x;
    } else {
      if (this.data.inputType == "keyboard") {
        // need to reset rotatePercent values
        //   when querying which keys are currently pressed
        this.rotatePercent.set(0, 0);

        if (this.isKeyPressed(this.data.turnLeftKey)) this.rotatePercent.y += 1;
        if (this.isKeyPressed(this.data.turnRightKey))
          this.rotatePercent.y -= 1;
      } // other, e.g. "joystick"
      else {
        // assume this.rotatePercent values have been set/reset elsewhere (outside of this function)
      }

      if (this.data.turnEnabled) {
        this.turnAngle += this.rotatePercent.y * turnAmount;
        this.el.object3D.rotation.y = this.turnAngle;
      }
    }

    // translations

    // this only works when rotation order = "YXZ"
    let finalTurnAngle = this.el.object3D.rotation.y;
    let model = document.getElementById("character");

    let c = Math.cos(finalTurnAngle);
    let s = Math.sin(finalTurnAngle);

    if (this.data.inputType == "keyboard") {
      // need to reset movePercent values
      //   when querying which keys are currently pressed
      this.movePercent.set(0, 0, 0);

      if (this.isKeyPressed(this.data.moveForwardKey)) {
        this.movePercent.z -= 1;
        model.setAttribute("animation-mixer", {
          clip: "Walk",
          loop: "repeat",
          crossFadeDuration: 0.3,
        });
      } else {
        model.setAttribute("animation-mixer", {
          clip: "Idle",
          loop: "repeat",
          crossFadeDuration: 0.3,
        });
      }

      if (this.isKeyPressed(this.data.moveBackwardKey)) this.movePercent.z += 1;
    } // other, e.g. "joystick"
    else {
      // assume this.movePercent values have been set/reset elsewhere (outside of this function)
    }

    // forward(z) direction: [ -s,  0, -c ]
    //   right(x) direction: [  c,  0, -s ]
    //      up(y) direction: [  0,  1,  0 ]
    // multiply each by (maximum) movement amount and percentages (how much to move in that direction)

    this.moveVector.set(-s * this.movePercent.z + c * this.movePercent.x,1 * this.movePercent.y,-c * this.movePercent.z - s * this.movePercent.x).multiplyScalar(moveAmount);

    this.el.object3D.position.add(this.moveVector);
  },
});

/**
 * Componente que permite visualizar de froma correcta los materiales de los avatares o de los npc
 */
AFRAME.registerComponent("character", {
  init: function () {
    let el = this.el;
    el.addEventListener("model-loaded", (e) => {
      let model = el.getObject3D("mesh");
      model.traverse((node) => {
        if (node.isMesh) {
          node.frustumCulled = false;
        }
      });
    });
  },
});

// Componentes de la escena #1 correspondiente al exterior de la fabrica

/**
 * Componente para asignar las texturas a los modelos correspondientes a la escena al exterior de la fabrica
 */
AFRAME.registerComponent("textura", {
  init: function () {
    let el = this.el;
    el.addEventListener("model-loaded", (e) => {
      let tree3D = el.getObject3D("mesh");
      let BakedTexture;
      if (el.id == "camion_01" ||el.id == "camion_02" ||el.id == "camion_03" ||el.id == "camion_04") {
        BakedTexture = new THREE.TextureLoader().load(`resources/Textures/Outdoors_Scene/camion_bake.jpg`);
      } else {
        BakedTexture = new THREE.TextureLoader().load(`resources/Textures/Outdoors_Scene/${el.id}_bake.jpg`);
      }
      BakedTexture.flipY = false;
      BakedTexture.encoding = THREE.sRGBEncoding;
      const bakedMaterial = new THREE.MeshBasicMaterial({ map: BakedTexture });
      if (!tree3D) {
        return;
      }
      tree3D.traverse(function (node) {
        if (node.isMesh) {
          node.material = bakedMaterial;
        }
      });
    });
  },
});

// Componentes de la escena #2 correspondiente a la oficina

/**
 * Componente para asignar las texturas a los modelos correspondientes a la escena al exterior de la fabrica
 */
AFRAME.registerComponent("textura-oficina", {
  init: function () {
    let el = this.el;
    el.addEventListener("model-loaded", (e) => {
      let tree3D = el.getObject3D("mesh");
      let BakedTexture;
      if (el.id == "pitillo_02" ||el.id == "pitillo_03" ||el.id == "pitillo_04" ||el.id == "pitillo_05" ||el.id == "pitillo_06" ||el.id == "pitillo_07" ||el.id == "pitillo_08" ||el.id == "pitillo_09") {
        BakedTexture = new THREE.TextureLoader().load(`resources/Textures/Office_Scene/pitillos_bake.jpg`);
      } else {
        BakedTexture = new THREE.TextureLoader().load(`resources/Textures/Office_Scene/${el.id}_bake.jpg`);
      }
      BakedTexture.flipY = false;
      BakedTexture.encoding = THREE.sRGBEncoding;
      const bakedMaterial = new THREE.MeshBasicMaterial({ map: BakedTexture });
      if (!tree3D) {
        return;
      }
      tree3D.traverse(function (node) {
        if (node.isMesh) {
          node.material = bakedMaterial;
        }
      });
    });
  },
});

/**
 * Función que permite desplegar las tarjetas con la información de la práctica
 */
function show() {
  let information = document.getElementById("container");
  let alertIcon = document.getElementById("alert");
  information.style.display = "flex";
  alertIcon.parentNode.removeChild(alertIcon);
}

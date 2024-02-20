/** variables relacionadas con el sonido ambiente */
let sound = document.getElementById("factorySound");
let soundIcon = document.getElementById("soundIcon");
let volumeBar = document.getElementById("volumeSlider");
let isPlaying = false;
let volumeVal = null;
let defaultValue = false;
let controlsInfo = null;
let names = document.getElementById("studentName");
let url = sessionStorage.getItem("url");
const domain = "https://sem-exp.netlify.app";

/**
 * Función que permite configurar el nombre del usuario en el Header.
 */
function setUserName() {
  names.innerHTML = `Ing. ${sessionStorage.getItem("userName")}`;
}

/**
 * Función que permite devolver una respuesta a la aplicación de React una vez el usuario ha terminado
 * el recorrido por el entorno virtual.
 */
function responseToParent() {
  window.parent.postMessage(url, domain);
}

/**
 * Función del boton "Volver" que permite indicarle a la ventana padre que el usuario no desea iniciar el entorno
 */
function exitVirtualEnvironment() {
  window.parent.postMessage("Abort", domain);
}

/**
 * Función que permite mostrar los controles al usuario
 */
function reveal() {
  controlsInfo = document.getElementById("controlsContainer");
  controlsInfo.style.display = "flex";
  hide();
}

/**
 * Función que remueve los controles de la interfaz despues de 10 segundos
 */
function hide() {
  setTimeout(() => {
    controlsInfo.style.display = "none";
  }, 10000);
}

/**
 * Función que permite iniciar el sonido ambiente
 */
function playSound() {
  if (isPlaying == false) {
    sound.play();
    sound.volume = 0.5;
    soundIcon.innerHTML = "volume_up";
    isPlaying = true;
  }
}

/**
 * Función que permite desplegar los controles del audio
 */
function volumeControl() {
  volumeBar.style.display = "block";
}

/**
 * Función que permite remover los controles del audio
 */
function quitVolumeControl() {
  volumeBar.style.display = "none";
}

/**
 * Función que permite reducir o aumentar el volumen del sonido ambiente a traves del slide
 */
volumeBar.oninput = function () {
  volumeVal = volumeBar.value;
  sound.volume = volumeVal / 100;
  if (sound.volume === 0) {
    soundIcon.innerHTML = "volume_off";
    isPlaying = false;
    defaultValue = true;
  } else if (sound.volume <= 0.5 && sound.volume >= 0) {
    soundIcon.innerHTML = "volume_down";
  } else {
    soundIcon.innerHTML = "volume_up";
  }
};

/**
 * Función que permite actualizar el volumen
 */
function updateSound() {
  if (isPlaying == false && sound.volume == 0 && defaultValue == false) {
    sound.volume = volumeVal / 100;
    volumeBar.value = volumeVal;
    if (sound.volume <= 0.5 && sound.volume >= 0) {
      soundIcon.innerHTML = "volume_down";
    } else {
      soundIcon.innerHTML = "volume_up";
    }
    isPlaying = true;
  } else if (isPlaying == true && sound.volume != 0 && defaultValue == false) {
    sound.volume = 0;
    volumeVal = volumeBar.value;
    volumeBar.value = 0;
    soundIcon.innerHTML = "volume_off";
    isPlaying = false;
  } else if (isPlaying == false && sound.volume == 0 && defaultValue == true) {
    sound.volume = 0.5;
    volumeBar.value = sound.volume * 100;
    soundIcon.innerHTML = "volume_up";
    isPlaying = true;
    defaultValue = false;
  }
}

/**
 * Función que permite conocer cuando la escena ha terminado de cargar y poder remover el loader
 */
document.addEventListener("DOMContentLoaded", function () {
  let scene = document.querySelector("a-scene");
  let landing = document.getElementById("landing");
  let loader = document.getElementById("loader");

  let path = window.location.pathname;
  let page = path.split("/").pop();
  console.log(page);

  scene.addEventListener("loaded", function (e) {
    setTimeout(() => {
      landing.style.display = "none";
      playSound();
    }, 5000);
  });
});

let timestamp = 0;
let interval = 200;


let mode = "start";

window.onload = () => {
  document.querySelector("#start").addEventListener("click", (e) => {
    populateSoundList();
    switchMode("scanning");
  });

  document.querySelector("#edit-btn").addEventListener("click", (e) => {
    switchMode("edit");
  });

  document.querySelector("#edit-done-btn").addEventListener("click", (e) => {
    setInfo();
    switchMode("scanning");
  });

  document.querySelector("#edit-image-btn").addEventListener("click", (e) => {
    selectImage();
  });

  document.querySelector("#edit-clear-btn").addEventListener("click", (e) => {
    clearInfo();
  });

  document
    .querySelector("#edit-clearall-btn")
    .addEventListener("click", (e) => {
      if (confirm("This will clear all associations!") == true) {
        clearInfo();
        localStorage.clear();
      } else {
      }
    });

  canvasBrightness = document.querySelector("#canvas-brightness");
  canvasBrightness.width = 10;
  canvasBrightness.height = 10;
  ctxBrightness = canvasBrightness.getContext("2d");

  canvasScanning = document.querySelector("#canvas-scanning");
  canvasScanning.width = 400;
  canvasScanning.height = 400;
  ctxScanning = canvasScanning.getContext("2d");

  // LottieInteractivity.create({
  //   player: "#reading-anim",
  //   mode: "cursor",
  //   actions: [
  //     {
  //       type: "click",
  //       forceFlag: false,
  //     },
  //   ],
  // });

  update();
};

const update = () => {
  switch (mode) {
    case "scanning":
      displayScanning();
      break;
    case "info":
      hideInfo();
      break;
  }

  if (Date.now() - timestamp > interval) {
    timestamp = Date.now();

    switch (mode) {
      case "scanning":
        checkScanningBrightness();
        break;
    }
  }

  requestAnimationFrame(update);
};

const switchMode = (m) => {
  document.querySelector(".screen.active").classList.remove("active");
  mode = m;
  switch (m) {
    case "start":
      document.querySelector("#start-screen").classList.add("active");
      break;
    case "scanning":
      startAnimation("#looking-anim");
      document.querySelector("#scanning-screen").classList.add("active");
      if (!scanningStarted) {
        startScanning();
      }
      clearScan();
      clearInfoItems();
      scanningTimestamp = Date.now();
      break;
    case "info":
      document.querySelector("#info-screen").classList.add("active");
      infoTimestamp = Date.now();
      break;
    case "edit":
      startAnimation("");
      document.querySelector("#edit-name").innerHTML = scannedCode;
      document.querySelector("#edit-screen").classList.add("active");
      break;
  }
  console.log("switched mode:", mode);
};

//////////////////
// scanning screen
//////////////////

let html5QrCode;
let scanningTimeout = 5000;
let successDebounce = 2000;
let scanningTimestamp = 0;
let canvasScanning, ctxScanning;
let scannedCode = "";
let scanningStarted = false;

const qrCodeSuccessCallback = (decodedText, decodedResult) => {
  if (mode === "scanning") {
    // console.log(decodedText, decodedResult);
    if (
      scannedCode !== decodedText ||
      Date.now() - scanningTimestamp > successDebounce
    ) {
      scannedCode = decodedText;
      document.querySelector("#debug-text").innerHTML = decodedText;
      flashScanning();
      scanningTimestamp = Date.now();
      setTimeout(() => {
        switchMode("info");
        displayInfo();
      }, 200);
    }
  }
};

const startScanning = () => {
  Html5Qrcode.getCameras()
    .then((devices) => {
      if (devices && devices.length) {
        var cameraId = devices[devices.length - 1].id;
        html5QrCode = new Html5Qrcode("reader");
        const config = {
          fps: 10,
          qrbox: { width: 300, height: 300 },
          experimentalFeatures: {
            useBarCodeDetectorIfSupported: true,
          },
        };

        html5QrCode.start(cameraId, config, qrCodeSuccessCallback);
        scanningStarted = true;
      }
    })
    .catch((err) => {
      // handle err
      document.querySelector("body").style.background = "red";
    });
};

const showScanning = () => {
  canvasScanning.classList.remove("hidden");
  startAnimation("#looking-anim");
};

const hideScanning = () => {
  scannedCode = "";
  canvasScanning.classList.add("hidden");
  startAnimation("#sleep-anim");
};

const flashScanning = () => {
  if (navigator.vibrate !== undefined) navigator.vibrate(100);
  canvasScanning.classList.add("highlight");
  setTimeout(() => {
    canvasScanning.classList.remove("highlight");
  }, 50);
};

const checkScanningBrightness = () => {
  if (Date.now() - scanningTimestamp > scanningTimeout) {
    if (document.querySelector("#reader video")) {
      ctxBrightness.drawImage(
        document.querySelector("#reader video"),
        0,
        0,
        10,
        10
      );
      const imgData = ctxBrightness.getImageData(0, 0, 10, 10);
      const value =
        imgData.data.filter((d, i) => i % 4 !== 3).reduce((a, b) => a + b) /
        300;
      if (value < 40) {
        hideScanning();
      } else {
        showScanning();
      }
    }
  }
};

const displayScanning = () => {
  if (document.querySelector("#reader video") && scanningStarted) {
    const vid = document.querySelector("#reader video");
    console.log(vid.videoWidth, vid.videoHeight);
    if (vid.videoWidth > 0 && vid.videoHeight > 0) {
      if (vid.readyState > 2) {
        // ctxScanning.drawImage(
        //   vid,
        //   0,
        //   0,
        //   vid.videoWidth,
        //   vid.videoHeight,
        //   0,
        //   0,
        //   400,
        //   400
        // );

        const imgW = vid.videoWidth;
        const imgH = vid.videoHeight;
        if (imgW > imgH) {
          ctxScanning.drawImage(
            vid,
            0,
            0,
            imgW,
            imgH,
            200 - (200 / imgH) * imgW,
            0,
            (400 / imgH) * imgW,
            400
          );
        } else {
          ctxScanning.drawImage(
            vid,
            0,
            0,
            imgW,
            imgH,
            0,
            200 - (200 / imgW) * imgH,
            400,
            (400 / imgW) * imgH
          );
        }
      }
    }
  }
};

const clearScan = () => {
  scannedCode = "";
  document.querySelector("#debug-text").innerHTML = "";
};

//////////////////
// anim handler
//////////////////

let animTimeout;
const startAnimation = (id) => {
  const activeEle = document.querySelector(".anim.active");
  if (activeEle) activeEle.classList.remove("active");
  if (animTimeout) clearTimeout(animTimeout);

  if (id !== "") {
    const newEle = document.querySelector(id);

    if (newEle) newEle.classList.add("active");

    if (id === "#reading-anim") {
      // document.querySelector(id).click();
      document.querySelector(id).stop();
      document.querySelector(id).play();
      animTimeout = setTimeout(() => {
        document.querySelector(".anim.active").classList.remove("active");
      }, 3000);
    }
  }
};

//////////////////
// info screen
//////////////////

let infoTimeout = 4000;
let infoTimestamp = 0;
let info;

const displayInfo = () => {
  console.log(scannedCode);
  info = localStorage.getItem(scannedCode);
  if (info === null) {
    startAnimation("#no-message-anim");
    info = {};
    document.querySelector("#info-text").innerHTML = scannedCode;
    clearInfoItems();
  } else {
    startAnimation("#reading-anim");
    setTimeout(() => {
      infoTimestamp = Date.now();
      info = JSON.parse(info);
      document.querySelector("#info-text").innerHTML = scannedCode;
      if (info.sound) {
        playSound(info.sound);
      }
      setInfoItems();
    }, 2500);
  }
};

const hideInfo = () => {
  if (Date.now() - infoTimestamp > infoTimeout) {
    switchMode("scanning");
  }
};

const clearInfoItems = () => {
  document.querySelector("#info-image").style.backgroundImage = `none`;
  document.querySelector(
    "#edit-image-placeholder"
  ).style.backgroundImage = `none`;
  document.querySelector("#edit-sound-list select").value = "none";
};

const setInfoItems = () => {
  if (info.image) {
    document.querySelector(
      "#info-image"
    ).style.backgroundImage = `url(${info.image})`;
    document.querySelector(
      "#edit-image-placeholder"
    ).style.backgroundImage = `url(${info.image})`;
  }
  if (info.sound) {
    document.querySelector("#edit-sound-list select").value = info.sound;
  }
};

//////////////////
// edit screen
//////////////////

const selectImage = () => {
  const input = document.createElement("input");
  input.type = "file";
  input.accept = "image/*";
  input.addEventListener("change", (e) => {
    loadImage(e);
  });
  document.querySelector("#stage").append(input);
  input.click();
};

const loadImage = (e) => {
  const image = document.createElement("img");
  image.onload = () => {
    const imgW = image.naturalWidth;
    const imgH = image.naturalHeight;
    if (imgW > imgH) {
      ctxScanning.drawImage(
        image,
        0,
        0,
        imgW,
        imgH,
        200 - (200 / imgH) * imgW,
        0,
        (400 / imgH) * imgW,
        400
      );
    } else {
      ctxScanning.drawImage(
        image,
        0,
        0,
        imgW,
        imgH,
        0,
        200 - (200 / imgW) * imgH,
        400,
        (400 / imgW) * imgH
      );
    }
    const data = canvasScanning.toDataURL();
    const placeholder = document.querySelector("#edit-image-placeholder");
    placeholder.style.backgroundImage = `url(${data})`;
    info.image = data;
  };
  image.src = URL.createObjectURL(e.target.files[0]);
  document.querySelector("#stage input").remove();
};

const setInfo = () => {
  if (info !== null) {
    localStorage.setItem(scannedCode, JSON.stringify(info));
  }
};

const clearInfo = () => {
  localStorage.removeItem(scannedCode);
  info = null;
  clearInfoItems();
};

//////////////////
// sound
//////////////////

const soundList = [
  {
    name: "bell",
    file: "audio/bell.wav",
  },
  {
    name: "star",
    file: "audio/star.wav",
  },
  {
    name: "boom",
    file: "audio/boom.mp3",
  },
  {
    name: "honk",
    file: "audio/honk.mp3", 
  },
  {
    name: "drum",
    file: "audio/drum.mp3", 
  },
  {
    name: "clap",
    file: "audio/clap.mp3", 
  },
  {
    name: "haha",
    file: "audio/haha.mp3", 
  },
  {
    name: "burp",
    file: "audio/burp.mp3",
  },
  {
    name: "woof",
    file: "audio/woof.mp3",
  },
  {
    name: "meow",
    file: "audio/meow.wav",
  },
  {
    name: "crow",
    file: "audio/crow.mp3", 
  },
  {
    name: "roar",
    file: "audio/roar.mp3", 
  },
  {
    name: "howl",
    file: "audio/howl.mp3", 
  },
];

let audioList = [];

const populateSoundList = () => {
  audioList = [];
  const listDiv = document.querySelector("#edit-sound-list");
  let options = `<option id="option-none" selected>none</option>`;
  soundList.forEach((s) => {
    options += `<option id="option-${s.name}">${s.name}</option>`;
    audioList.push({
      name: s.name,
      audio: new Audio(),
    });
    audioList[audioList.length - 1].audio.src = s.file;
  });
  listDiv.innerHTML = `<select>${options}</select>`;
  listDiv.querySelector("select").addEventListener("change", (e) => {
    console.log(e.target.value);
    info.sound = e.target.value;
    playSound(info.sound);
  });
};

const playSound = (value) => {
  const sound = audioList.filter((s) => s.name === value);
  if (sound.length > 0) {
    sound[0].audio.play();
  }
};

//////////////////
// staging
//////////////////

let canvasBrightness, ctxBrightness;

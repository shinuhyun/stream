console.log("hello");

const socket = io();

const myFace = document.getElementById("myFace");
const welcome = document.getElementById("welcome");
const call = document.getElementById("call");
const camerasSelect = document.getElementById("cameras");

let myStream;
let roomName;
let myPeerConnection;

call.hidden = true;

camerasSelect.addEventListener("input", handleCameraChange);

async function handleCameraChange() {
  await getMedia(camerasSelect.value);
  if (myPeerConnection) {
    const videoTrack = myStream.getVideoTracks()[0];
    console.log(myPeerConnection.getSenders());
    const videoSender = myPeerConnection
      .getSenders()
      .find((sender) => (sender.track.kind = "video"));
    videoSender.replaceTrack(videoTrack);
  }
}

async function getCameras() {
  try {
    const devices = await navigator.mediaDevices.enumerateDevices();
    const cameras = devices.filter((device) => device.kind === "videoinput");
    cameras.forEach((camera) => {
      const option = document.createElement("option");
      option.value = camera.deviceId;
      option.innerText = camera.label;
      camerasSelect.appendChild(option);
    });
  } catch (e) {
    console.log(e);
  }
}

async function getMedia(deviceId) {
  const cameraConstraints = {
    video: { deviceId: { exact: deviceId } },
  };
  try {
    myStream = await navigator.mediaDevices.getUserMedia(
      deviceId
        ? cameraConstraints
        : {
            video: true,
          }
    );
    myFace.srcObject = myStream;
    if (!deviceId) {
      await getCameras();
    }
  } catch (err) {
    console.log(err);
  }
}

welcomeForm = welcome.querySelector("form");

// Peer A,B 공용
async function handleWelcomeSubmit(event) {
  event.preventDefault();
  const input = welcomeForm.querySelector("input");
  await initCall();
  socket.emit("enter_room", input.value);
  roomName = input.value;
  input.value = "";
}

welcomeForm.addEventListener("submit", handleWelcomeSubmit);

async function initCall() {
  welcome.hidden = true;
  call.hidden = false;
  await getMedia();
  makeConnection();
}

// Socket Code

socket.on("welcome", async () => {
  console.log("someone joined");
  const offer = await myPeerConnection.createOffer();
  myPeerConnection.setLocalDescription(offer);
  console.log("send the offer");
  console.log(offer);
  socket.emit("offer", offer, roomName);
});

socket.on("offer", async (offer) => {
  console.log("received the offer", offer);
  myPeerConnection.setRemoteDescription(offer);
  const answer = await myPeerConnection.createAnswer();
  myPeerConnection.setLocalDescription(answer);
  console.log(answer);
  socket.emit("answer", answer, roomName);
  console.log("sent the answer");
});

socket.on("answer", (answer) => {
  console.log("received the answer");
  myPeerConnection.setRemoteDescription(answer);
});

socket.on("ice", (ice) => {
  console.log("received candidate");
  myPeerConnection.addIceCandidate(ice);
});

// RTC Code

function makeConnection() {
  myPeerConnection = new RTCPeerConnection();
  myPeerConnection.addEventListener("icecandidate", handleIce);
  myPeerConnection.addEventListener("track", handleTrack);

  myStream
    .getTracks()
    .forEach((track) => myPeerConnection.addTrack(track, myStream));
}

function handleTrack(data) {
  console.log("handle track");
  const peerFace = document.querySelector("#peerFace");
  peerFace.srcObject = data.streams[0];
}

function handleIce(data) {
  console.log("sent candidate");
  socket.emit("ice", data.candidate, roomName);
}

function handleAddStream(data) {
  console.log(data.stream);
  const peerFace = document.getElementById("peerFace");
  peerFace.srcObject = data.stream;
}

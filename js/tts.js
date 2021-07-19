const synth = window.speechSynthesis;
const voices = synth.getVoices();

function ttsSpeak(text) {
    const utterThis = new SpeechSynthesisUtterance(text);
    utterThis.onend = function (event) {
        console.log('SpeechSynthesisUtterance.onend');
    }
    utterThis.onerror = function (event) {
        console.error('SpeechSynthesisUtterance.onerror');
    }
    utterThis.voice = voices[0];
    utterThis.pitch = 1;
    utterThis.rate = 0.9;

    synth.speak(utterThis);
}
function ttsHtmlSpeak(id) {
    const textVec = document.getElementById(id).innerText.split('.');

    ttsSpeak(textVec[0])
}
function ttsPause() {
    synth.pause()
}
function ttsResume() {
    synth.resume()
}
function ttsCancel() {
    synth.cancel()
}


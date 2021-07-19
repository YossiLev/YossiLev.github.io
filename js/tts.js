const synth = window.speechSynthesis;
const voices = synth.getVoices();

function ttsSpeak(message) {
    try {
        const messageParts = message.split('.')

        let currentIndex = 0
        const speak = (textToSpeak) => {
            const msg = new SpeechSynthesisUtterance();
            msg.voice = voices[0];
            msg.volume = 1; // 0 to 1
            msg.rate = 1; // 0.1 to 10
            msg.pitch = 1; // 0 to 2
            msg.text = textToSpeak;
            msg.lang = 'en-US';

            msg.onend = function() {
                currentIndex++;
                if (currentIndex < messageParts.length) {
                    setTimeout(() => {
                        speak(messageParts[currentIndex])
                    }, 500)
                }
            };
            synth.speak(msg);
        }
        speak(messageParts[0])
    } catch (e) {
        console.error(e)
    }
}

function ttsHtmlSpeak(id) {
    ttsSpeak(document.getElementById(id).textContent)
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


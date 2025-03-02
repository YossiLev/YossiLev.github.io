addMasthead = () => {
    const header = document.createElement("div");
    header.innerHTML = '<a style="color: white; float:left;" href="/index.html"><i onclick="" class="material-icons">home</i></a>' +
        'The site of new ideas' +
        '<i style="float:right; cursor: pointer;" onclick="openMailMessage()" class="material-icons">mail</i>' ;//+
       // '<i style="float:right;" onclick="" class="material-icons">print</i>'
    ;
    header.classList.add('header');

    const body = document.getElementsByTagName("BODY")[0];
    body.insertBefore(header, body.firstChild);
}
const pages = [
    {display: "Abstract", page: "abstract"},
    {display: "Introduction", page: "introduction"},
    {display: "The Postulates", page: "postulates"},
    {display: "Particles I", page: "particles1"},
    {display: "Special Relativity *", page: "srMechanics"},
    {display: "Gravitation", page: "gr"},
    {display: "Cosmology", page: "cosmology"},
    {display: "Particles II", page: "particles2"},
    {display: "Electric Charge", page: "charge"},
    {display: "Processes", page: "processes"},
    {display: "Particles III", page: "particles3"},
    {display: "Scattering", page: "scattering"},
    {display: "QFT", page: "qft"},
    {display: "Topology", page: "topology"},
    {display: "Topological QFT", page: "tqft"},
    {display: "Predictions", page: "predictions"},
    {display: "Quantum Mechanics", page: "qm"},
    {display: "Constants of Nature", page: "constants"},
    {display: "Light", page: "light"},
    {display: "Definitions", page: "definitions"},
    {display: "Inventions", page: "inventions"},
];
const appendixes = [
    {label: "A", display: "Momentum, Energy, Mass", page: "massEnergy"},
    {label: "B", display: "Central Drift", page: "centralDrift"},
    {label: "C", display: "Photons", page: "noPhotons"},
    {label: "D", display: "Gravitation & Time", page: "grDilation"},
    {label: "E", display: "Light Orbits", page: "lightOrbit"},
    {label: "F", display: "Torus Flow", page: "torusFlow"},
    {label: "G", display: "Length Contraction", page: "srLength"},
    {label: "h", display: "Video References", page: "videos"},
];
const goToPage = (pageIndex) => {
    if (pageIndex >= pages.length) {
        return goToAppendix(pageIndex - pages.length)
    }
    const thisPage = window.location.href.match(/\/([a-zA-Z0-9]+)\.html/);
    window.location.href = window.location.href.replace(`/${thisPage[1]}.html`, `/${pages[pageIndex].page}.html`)
}
const goToAppendix = (pageIndex) => {
    const thisPage = window.location.href.match(/\/([a-zA-Z0-9]+)\.html/);
    window.location.href = window.location.href.replace(`/${thisPage[1]}.html`, `/${appendixes[pageIndex].page}.html`)
}
const removeContent = () => {
    getArrayByClass("contentList").forEach(el => {
        el.parentElement.removeChild(el);
    });
}
const displayContent = (pageIndex) => {
    const content = document.createElement("div");
    content.innerHTML = pages.map((p, ip) => {
        return ip === pageIndex
            ? `<div style="color: yellow">${ip + 1}. ${p.display}</div>`
            : `<div style="cursor: pointer;" onclick="goToPage(${ip});">${ip + 1}. ${p.display}</div>`
    }).concat('<div style="margin-top:5px; text-decoration: underline;">Appendices</div>').concat(...appendixes.map((p, ip) => {
            return ip === (pageIndex - pages.length)
                ? `<div style="color: yellow">${p.label} - ${p.display}</div>`
                : `<div style="cursor: pointer;" onclick="goToAppendix(${ip});">${p.label} - ${p.display}</div>`
        }
    )).join('');
    content.classList.add('contentList');
    content.onclick = (e) => {
        removeContent();
    }
    const body = document.getElementsByTagName("BODY")[0];
    body.insertBefore(content, body.firstChild);
}
getPageName = () => {
    const thisPage = window.location.href.match(/\/([a-zA-Z0-9]+)\.html/);
    return thisPage[1];
}
addPager = () => {
    if (window.location.href.includes('/Theory')) {
        const pageName = getPageName();
        const index = pages.concat(appendixes).findIndex(p => p.page === pageName);
        const header = document.createElement("div");
        header.innerHTML =
            `<span onclick="displayContent(${index})" style="cursor: pointer;"><i class="material-icons" style="vertical-align: bottom;">list</i>Content list</span>` +
            (index > 0
                ? `<span onclick="goToPage(${index - 1})" style="cursor: pointer; float:left;"><i class="material-icons" style="vertical-align: bottom;">navigate_before</i>${index - 1 < pages.length ? pages[index - 1].display : appendixes[index - pages.length - 1].display}</span>`
                : '') +
            (index < pages.length + appendixes.length - 1
                ? `<span onclick="goToPage(${index + 1})" style="cursor: pointer; float:right;">${index + 1 < pages.length ? pages[index + 1].display : appendixes[index - pages.length + 1].display}<i class="material-icons" style="vertical-align: bottom;">navigate_next</i></span>`
                : '');
        header.classList.add('pager');

        const body = document.getElementsByTagName("BODY")[0];
        body.insertBefore(header, body.firstChild);
    }
}
addHeader = () => {
    addPager();
    addMasthead();
}
popupFile = (fName) => {
    let xhr = new XMLHttpRequest();

    // Define what to do when the request is successful
    xhr.onload = function() {
        let oChild = document.body.appendChild(document.createElement("div"));
        oChild.id = "overlayGo";
        oChild.innerHTML = "<div id=\"overlay-content\" class=\"overlay-content\" onclick=\"event.stopPropagation()\"></div>";
        oChild.classList = "overlay";
        oChild.onclick = () => {document.body.removeChild(document.getElementById('overlayGo'));};
        oChild.style.display = 'flex';

        // Display the file contents in the overlay content
        document.getElementById('overlay-content').innerHTML = xhr.responseText;

        // Execute any JavaScript code in the loaded HTML
        let scripts = document.getElementById('overlay-content').getElementsByTagName('script');
        console.log(scripts.length);
        for (let i = 0; i < scripts.length; i++) {
            console.log(i);
            console.log(scripts[i]);
            let script = scripts[i];
            let src = script.src;
            if (src) {
                console.log("src");
                // If the script has a "src" attribute, load the external script file
                let xhr2 = new XMLHttpRequest();
                xhr2.onload = function() {
                    eval(xhr2.responseText);
                };
                xhr2.open('GET', src, false);
                xhr2.send();
            } else {
                // If the script does not have a "src" attribute, evaluate the script code directly
                console.log("innerHTML");
                eval(script.innerHTML);
            }
        }
        MathJax.typeset()
    };

    xhr.onerror = function() {
        alert('Error reading file.');
    };

    xhr.open('GET', fName, true);
    xhr.send();

}
optionalOpenClose = () => {
    getArrayByClass("optionalCloser").forEach(el => {
        el.onclick = (e) => {
            let par = e.target.closest(".optionalParagraph");
            par.classList.add("optionalStatusClosed");
        }
    });
    getArrayByClass("optionalClosing").forEach(el => {
        el.onclick = (e) => {
            let par = e.target.closest(".optionalParagraph");
            par.classList.remove("optionalStatusClosed");
        }
    });
}
fillAppendixOrder = () => {
    if (window.location.href.includes('/Theory')) {
        const pageName = getPageName();
        const appendixObj = appendixes.find(a => a.page === pageName)
        if (appendixObj) {
            const appendixLabel = appendixObj.label;
            getArrayByClass("appendHead").forEach(el => {
                el.innerHTML = `<u>Appendix ${appendixLabel}</u> ${el.innerHTML}`;
            })
        }
    }
}
zoomOnImages = () => {
    getArrayByClass("insertImage").forEach(el => {
        el.onclick = (e) => {
            e.target.closest(".insertImage").classList.toggle("extendedImage");
        }
    });
}
equationsLabels = () => {
   // getArrayByClass("equLabel").forEach(el => el.innerText = el.id);
}
getArrayByClass = (className) => {
    let vs = document.getElementsByClassName(className);
    let ar = [];
    for (let item in vs) {
        if (vs.hasOwnProperty(item)) {
            ar.push(vs[item]);
        }
    }
    return ar;
}
const mailFrameClose = (ide) => {
    const el = document.getElementById(ide);
    el.parentElement.removeChild(el);
}

openMailMessage = () => {
    const mailId = 'mailMessage';
    const mailFrame = document.createElement("div");
    mailFrame.classList.add('mailFrame');
    mailFrame.id = mailId;

    mailFrame.innerHTML =
            `<i class="material-icons closeButton" onclick="mailFrameClose('${mailId}');" style="cursor: pointer; float:right; margin-top: -20px;" >close</i>`
            + `<div>Comments, questions are welcomed at yossi.lev.home@gmail.com</div>`;
    const body = document.getElementsByTagName("BODY")[0];
    body.insertBefore(mailFrame, body.firstChild);
}
initActions = () => {
    getArrayByClass("action").forEach(el => {
        el.style.color = "blue";
        el.style.textDecoration = "underline";
        el.onclick = (e) => clickAction(e, document.getElementById(el.dataset.canvas), el.dataset.action)
        el.onmousemove = (e) => clickAction(e, document.getElementById(el.dataset.canvas), el.dataset.action)
    });
}

initToolTipView = () => {
    getArrayByClass("toolTipView").forEach(el => {
        el.style.color = "blue";
        el.style.textDecoration = "underline";
        const ch = Array.from(el.children).find(c => c.classList.contains('toolTipContent'));
        el.onclick = (e) => {
            ch.style.visibility = 'visible';
        }
        const clButton = document.createElement("div");
        ch.insertBefore(clButton, ch.firstChild);
        clButton.classList.add('clButton');
        clButton.innerHTML = "X";
        clButton.onclick = (e) => {
            ch.style.visibility = 'hidden';
            e.stopPropagation();
        }

//        el.onmousemove = (e) => clickAction(e, document.getElementById(el.dataset.canvas), el.dataset.action)
    });
}

addTts = () => {
    getArrayByClass("tts").forEach(el => {
        const tts = document.createElement("span");
        tts.innerHTML = '<i class="material-icons" style="vertical-align: bottom;">volume_mute</i>';
        tts.onclick = () => ttsElementSpeak(el);
        tts.style.cursor = "pointer";
        tts.style.float = "left";
        tts.style.position = "relative";
        tts.style.left = "0px";
        el.parentNode.insertBefore(tts, el);
    });
}

webGlFocus = () => {
    getArrayByClass("canvasWebGl").forEach(el => {
        el.onfocus = ((e) => glWorld.setFocusByCanvas(e.target));
    });
}
webGlGuide = () => {
    getArrayByClass("webGlGuide").forEach(el => {
        const guideButton = document.createElement("div");
        guideButton.classList.add('closeButton', 'guideButton');
        guideButton.onclick = (e) => {
            webGlPresentGuide(e, el.id);
        }
        guideButton.innerText = "?";

        el.parentElement.insertBefore(guideButton, el);
    });
}
webGlCloseGuide = (ide) => {
    const el = document.getElementById(ide);
    el.parentElement.removeChild(el);
}
webGlPresentGuide = (e, id) => {
    const glElement = document.getElementById(id);
    const guideId = 'guideOf_' + id;
    const guideFrame = document.createElement("div");
    guideFrame.classList.add('guideFrame');
    guideFrame.id = guideId;

    guideFrame.innerHTML =
        `<i class="material-icons closeButton" onclick="webGlCloseGuide('${guideId}');" style="cursor: pointer; float:right; margin-top: -20px;" >close</i>`
        + glWorld.getGuide().map(l => `<div>${l}</div>`).join('');
    glElement.parentElement.insertBefore(guideFrame, glElement);
}
embedVideo = (label) => {
    const vidFrame = document.createElement("div");
    vidFrame.classList.add('vidFrame');
    vidFrame.onclick = (e) => {
        const el = e.target.closest(".vidFrame");
        el.parentElement.removeChild(el);
    }

    const vid = document.createElement("div");
    vid.innerHTML = `<iframe width="560" height="315" src="https://www.youtube.com/embed/${label}" title="YouTube video player" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>`;
    vidFrame.appendChild(vid);
    const body = document.getElementsByTagName("BODY")[0];
    body.insertBefore(vidFrame, body.firstChild);
}

initializeSelect = () => {
    let x, i, j, l, ll, selElmnt, a, b, c;
    /*look for any elements with the class "custom-select":*/
    x = document.getElementsByClassName("custom-select");
    l = x.length;
    for (i = 0; i < l; i++) {
        selElmnt = x[i].getElementsByTagName("select")[0];
        ll = selElmnt.length;
        /*for each element, create a new DIV that will act as the selected item:*/
        a = document.createElement("DIV");
        a.setAttribute("class", "select-selected");
        a.innerHTML = selElmnt.options[selElmnt.selectedIndex].innerHTML;
        x[i].appendChild(a);
        /*for each element, create a new DIV that will contain the option list:*/
        b = document.createElement("DIV");
        b.setAttribute("class", "select-items select-hide");
        for (j = 1; j < ll; j++) {
            /*for each option in the original select element,
            create a new DIV that will act as an option item:*/
            c = document.createElement("DIV");
            c.innerHTML = selElmnt.options[j].innerHTML;
            c.addEventListener("click", function (e) {
                /*when an item is clicked, update the original select box,
                and the selected item:*/
                var y, i, k, s, h, sl, yl;
                s = this.parentNode.parentNode.getElementsByTagName("select")[0];
                sl = s.length;
                h = this.parentNode.previousSibling;
                for (i = 0; i < sl; i++) {
                    if (s.options[i].innerHTML == this.innerHTML) {
                        s.selectedIndex = i;
                        h.innerHTML = this.innerHTML;
                        y = this.parentNode.getElementsByClassName("same-as-selected");
                        yl = y.length;
                        for (k = 0; k < yl; k++) {
                            y[k].removeAttribute("class");
                        }
                        this.setAttribute("class", "same-as-selected");
                        break;
                    }
                }
                h.click();
            });
            b.appendChild(c);
        }
        x[i].appendChild(b);
        a.addEventListener("click", function (e) {
            /*when the select box is clicked, close any other select boxes,
            and open/close the current select box:*/
            e.stopPropagation();
            closeAllSelect(this);
            this.nextSibling.classList.toggle("select-hide");
            this.classList.toggle("select-arrow-active");
        });
    }

    function closeAllSelect(elmnt) {
        /*a function that will close all select boxes in the document,
        except the current select box:*/
        var x, y, i, xl, yl, arrNo = [];
        x = document.getElementsByClassName("select-items");
        y = document.getElementsByClassName("select-selected");
        xl = x.length;
        yl = y.length;
        for (i = 0; i < yl; i++) {
            if (elmnt == y[i]) {
                arrNo.push(i)
            } else {
                y[i].classList.remove("select-arrow-active");
            }
        }
        for (i = 0; i < xl; i++) {
            if (arrNo.indexOf(i)) {
                x[i].classList.add("select-hide");
            }
        }
    }

    document.addEventListener("click", closeAllSelect);
}
console.log("main.js");
window.onloadFuncs = [addHeader, fillAppendixOrder, optionalOpenClose, equationsLabels,
    zoomOnImages, initActions, addTts, webGlFocus, webGlGuide, initToolTipView, initializeSelect];

window.onload = function()
{
    for(let i in this.onloadFuncs) {
        this.onloadFuncs[i]();
    }
}

addMasthead = () => {
    const header = document.createElement("div");
    header.innerHTML = '<a style="color: white; float:left;" href="/index.html"><i onclick="" class="material-icons">home</i></a>' +
        'The site of new ideas' +
        '<i style="float:right;" onclick="" class="material-icons">mail</i>' +
        '<i style="float:right;" onclick="" class="material-icons">print</i>'
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
            getArrayByClass("equLabel").forEach(el => {
                el.innerHTML = `<u>Appendix ${appendixLabel}</u> ${el.innerHTML}`;
            })
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
    getArrayByClass("equLabel").forEach(el => el.innerText = el.id);
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

initActions = () => {
    getArrayByClass("action").forEach(el => {
        el.style.color = "blue";
        el.style.textDecoration = "underline";
        el.onclick = (e) => clickAction(e, document.getElementById(el.dataset.canvas), el.dataset.action)
        el.onmousemove = (e) => clickAction(e, document.getElementById(el.dataset.canvas), el.dataset.action)
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
webGlPresentGuide = (e, id) => {
    const glElement = document.getElementById(id);
    const guideId = 'guideOf_' + id;
    const guideFrame = document.createElement("div");
    guideFrame.classList.add('guideFrame');
    guideFrame.id = guideId;
    webGlCloseGuide = (ide) => {
        const el = document.getElementById(ide);
        el.parentElement.removeChild(el);
    }
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
window.onloadFuncs = [addHeader, fillAppendixOrder, optionalOpenClose, equationsLabels,
    zoomOnImages, initActions, addTts, webGlFocus, webGlGuide];

window.onload = function()
{
    for(let i in this.onloadFuncs) {
        this.onloadFuncs[i]();
    }
}

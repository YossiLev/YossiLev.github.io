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
const goToPage = (pageIndex) => {
    console.log(`go to ${pages[pageIndex].display}`);
    const thisPage = window.location.href.match(/\/([a-zA-Z0-9]+)\.html/);
    window.location.href = window.location.href.replace(`/${thisPage[1]}.html`, `/${pages[pageIndex].page}.html`)
}
const removeContent = () => {
    let vs = document.getElementsByClassName("contentList");
    for (let item in vs) {
        if (vs.hasOwnProperty(item)) {
            vs[item].parentElement.removeChild(vs[item]);
        }
    }
}

const displayContent = (pageIndex) => {
    const content = document.createElement("div");
    content.innerHTML = pages.map((p, ip) => {
        return ip === pageIndex
            ? `<div style="color: yellow">${ip + 1}. ${p.display}</div>`
            : `<div style="cursor: pointer;" onclick="goToPage(${ip});">${ip + 1}. ${p.display}</div>`
    }).join('');
    content.classList.add('contentList');
    content.onclick = (e) => {
        removeContent();
    }
    const body = document.getElementsByTagName("BODY")[0];
    body.insertBefore(content, body.firstChild);
}
addPager = () => {
    if (window.location.href.includes('/Theory')) {
        const thisPage = window.location.href.match(/\/([a-zA-Z0-9]+)\.html/);
        const index = pages.findIndex(p => p.page === thisPage[1]);
        const header = document.createElement("div");
        header.innerHTML =
            `<span onclick="displayContent(${index})" style="cursor: pointer;"><i class="material-icons" style="vertical-align: bottom;">list</i>Content list</span>` +
            (index > 0
                ? `<span onclick="goToPage(${index - 1})" style="cursor: pointer; float:left;"><i class="material-icons" style="vertical-align: bottom;">navigate_before</i>${pages[index - 1].display}</span>`
                : '') +
            (index < pages.length - 1
                ? `<span onclick="goToPage(${index + 1})" style="cursor: pointer; float:right;">${pages[index + 1].display}<i class="material-icons" style="vertical-align: bottom;">navigate_next</i></span>`
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
    let vs = document.getElementsByClassName("optionalCloser")
    for (let item in vs) {
        if (vs.hasOwnProperty(item)) {
            vs[item].onclick = (e) => {
                let par = e.target.closest(".optionalParagraph");
                par.classList.add("optionalStatusClosed");
            }
        }
    }
    vs = document.getElementsByClassName("optionalClosing")
    for (let item in vs) {
        if (vs.hasOwnProperty(item)) {
            vs[item].onclick = (e) => {
                let par = e.target.closest(".optionalParagraph");
                par.classList.remove("optionalStatusClosed");
            }
        }
    }
}
zoomOnImages = () => {
    let vs = document.getElementsByClassName("insertImage")
    for (let item in vs) {
        if (vs.hasOwnProperty(item)) {
            vs[item].onclick = (e) => {
                e.target.closest(".insertImage").classList.toggle("extendedImage");
            }
        }
    }
}
equationsLabels = () => {
    let vs = document.getElementsByClassName("equLabel")
    for (let item in vs) {
        if (vs.hasOwnProperty(item)) {
            vs[item].innerText = vs[item].id;
        }
    }
}
window.onload = () => {
    addHeader();
    optionalOpenClose();
    equationsLabels();
    zoomOnImages();
}

addHeader = () => {
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

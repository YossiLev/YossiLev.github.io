addHeader = () => {
    const header = document.createElement("div");
    header.innerHTML = '<a href="/index.html">Home</a> - The site of new ideas';
    header.classList.add('header');

    const body = document.getElementsByTagName("BODY")[0];
    body.insertBefore(header, body.firstChild);
}
optionalOpenClose = () => {
    let vs = document.getElementsByClassName("optionalCloser")
    for (let item in vs) {
        vs[item].onclick = (e) => {
            let par = e.target.closest(".optionalParagraph");
            par.classList.add("optionalStatusClosed");
        }
    }
    vs = document.getElementsByClassName("optionalClosing")
    for (let item in vs) {
        console.log(vs[item]);
        vs[item].onclick = (e) => {
            let par = e.target.closest(".optionalParagraph");
            par.classList.remove("optionalStatusClosed");
        }
    }
}
window.onload = () => {
    addHeader();
    optionalOpenClose();
}

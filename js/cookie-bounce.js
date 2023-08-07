let x = 0,
    y = 0,
    dirX = 1,
    dirY = 1;
const speed = 2;
const fortuneCookie = document.getElementById("fortune-cookie");
const cookieWidth = fortuneCookie.clientWidth;
const cookieHeight = fortuneCookie.clientHeight;

function animate() {
    const screenHeight = document.body.clientHeight;
    const screenWidth = document.body.clientWidth;

    if (y + cookieHeight >= screenHeight || y < 0) {
        dirY *= -1;
    }
    if (x + cookieWidth >= screenWidth || x < 0) {
        dirX *= -1;
    }
    x += dirX * speed;
    y += dirY * speed;


    fortuneCookie.style.left = x + "px";
    fortuneCookie.style.top = y + "px";
    window.requestAnimationFrame(animate);
}

window.requestAnimationFrame(animate);

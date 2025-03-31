document.addEventListener("DOMContentLoaded", function () {
  fetch("/PETTY/templates/navbar.html")
    .then((response) => response.text())
    .then((data) => {
      document.getElementById("navbar").innerHTML = data;
    });

  fetch("/PETTY/templates/footer.html")
    .then((response) => response.text())
    .then((data) => {
      document.getElementById("footer").innerHTML = data;
    });
});

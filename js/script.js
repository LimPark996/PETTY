document.addEventListener("DOMContentLoaded", function () {
  
  fetch("/PETTY/templates/footer.html")
    .then((response) => response.text())
    .then((data) => {
      document.getElementById("footer").innerHTML = data;
    });
});

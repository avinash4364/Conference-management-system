const addAuthor = document.querySelector(".add");
const allAuthor = document.querySelector(".all-authors");
addAuthor.addEventListener("click", () => {
  allAuthor.innerHTML += `<div class="author">
    <label for="author_name"><b>Author Name</b></label>
    <input type="text" name="author_name" id="author_name">
    <label for="email"><b>Email</b></label>
    <input type="email" name="email" id="email">
  </div>`;
});

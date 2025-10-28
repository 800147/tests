export const showInPageNotification = (text, link) => {
  const element = document.createElement("div");
  const close = () => element.parentNode?.removeChild(element);
  element.innerHTML = `<blockquote><a class="Notification-Link" href=""></a><span></span><button class="Notification-CloseButton">close</button></blockquote>`;
  element.className = "Notification";
  element.querySelector("span").innerText = text;
  element.querySelector("a").href = link;
  element.querySelector("button").addEventListener("click", close);

  document.querySelector("main").appendChild(element);
  setTimeout(close, 5_000);
};

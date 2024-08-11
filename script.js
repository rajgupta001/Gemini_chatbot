const typingForm = document.querySelector(".typing-form");
const chatList = document.querySelector(".chat-list");

const suggestions = document.querySelectorAll(".suggestion-list .suggestion")

// Implement light mode s-1
const toggleThemeButton = document.querySelector("#toggle-theme-button");
const deleteChatButton = document.querySelector("#delete-chat-button");



let userMessage = null;
let isResponseGenerating = false;

// API CONFIGURATION
const API_KEY = "AIzaSyCOAEaLn_-MWxzoyu0X7zyIH_cXAEB3Jyw";
const API_URL = `https://generativelanguage.googleapis.com/v1/models/gemini-pro:generateContent?key=${API_KEY}`;

const loadLocalstorageData = () => {
  const savedChats = localStorage.getItem("savedChats");
  const isLightMode = localStorage.getItem("themeColor") === "light_mode";

  // Apply the stored theme
  document.body.classList.toggle("light_mode", isLightMode);
  toggleThemeButton.innerText = isLightMode ? "dark_mode" : "light_mode";

  // Restore saved chats
  chatList.innerHTML = savedChats || "";
  document.body.classList.toggle("hide-header",savedChats); // hide the header once chat start

  chatList.scrollTo(0,chatList.scrollHeight); //Scroll to the bottom

};

loadLocalstorageData();

// Create a new message element and return it
const createMessageElement = (content, ...classes) => {
  const div = document.createElement("div");
  div.classList.add("message", ...classes);
  div.innerHTML = content;
  return div;
};

// show typing effect by displaying words one by one
const showTypingEffect = (text, textElement, incomingMessageDiv) => {
  const words = text.split(" ");
  let currentWordIndex = 0;

  const typingInterval = setInterval(() => {
    // Append each word to the text element with a space
    textElement.innerText +=
      (currentWordIndex === 0 ? "" : " ") + words[currentWordIndex++];
    incomingMessageDiv.querySelector(".icon").classList.add("hide");

    // IF all words are displayed;
    if (currentWordIndex === words.length) {
        isResponseGenerating = false;
      clearInterval(typingInterval);
      incomingMessageDiv.querySelector(".icon").classList.remove("hide");
      localStorage.setItem("savedChats", chatList.innerHTML); // Save chats to local storage
    }
    chatList.scrollTo(0,chatList.scrollHeight); //Scroll to the bottom
}, 75);
};

// fetch response from the api based on user message
const generateAPIResponse = async (incomingMessageDiv) => {
  const textElement = incomingMessageDiv.querySelector(".text"); // Get text Element
  // SEND a POST request to the API with the user's message
  try {
    const response = await fetch(API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [
          {
            role: "user",
            parts: [{ text: userMessage }],
          },
        ],
      }),
    });
    const data = await response.json();
    if(!response.ok) throw new Error(data.error.message);


    // Get the api response text  and remove asterisks from it
    const apiResponse = data?.candidates[0].content.parts[0].text.replace(/\*\*(.*?)\*\*/g,"$1");
    showTypingEffect(apiResponse, textElement, incomingMessageDiv);
  } catch (error) {
    isResponseGenerating = false;
    textElement.innerText = error.message;
    textElement.classList.add("error");
  } finally {
    incomingMessageDiv.classList.remove("loading");
  }
};

// show a loading animation while waiting for the API RESPONSE
const showLoadinAnimation = () => {
  const html = `      <div class="message-content">
                <img src="images/gemini.svg" alt="Gemini Image" class="avatar">
                <p class="text"></p>
                <div class="loading-indicator">
                    <div class="loading-bar"></div>
                    <div class="loading-bar"></div>
                    <div class="loading-bar"></div>
                </div>
            </div>
            <span onclick="copyMessage(this)" class="icon material-symbols-outlined">content_copy</span>`;

  const incomingMessageDiv = createMessageElement(html, "incoming", "loading");
  chatList.appendChild(incomingMessageDiv);

  chatList.scrollTo(0,chatList.scrollHeight); //Scroll to the bottom
  generateAPIResponse(incomingMessageDiv);
};

// Copy message text to the clipboard
const copyMessage = (copyIcon) => {
  const messageText = copyIcon.parentElement.querySelector(".text").innerText;

  navigator.clipboard.writeText(messageText);
  copyIcon.innerText = "done"; // show tick icon
  setTimeout(() => (copyIcon.innerText = "content_copy"), 1000); // Rever icon after 1 second
};

// Handle sending outgoing chat messages
const handleOutgoingChat = () => {
  userMessage = typingForm.querySelector(".typing-input").value.trim() || userMessage;
  if (!userMessage || isResponseGenerating) return; // Exit if there is not message
  
  isResponseGenerating = true;
  const html = ` <div class="message-content">
                <img src="images/user.jpg" alt="User Image" class="avatar">
                <p class="text"></p>
            </div>`;

  // creating an element of outgoing message and adding it to the chat list
  const outgoingMessageDiv = createMessageElement(html, "outgoing");
  outgoingMessageDiv.querySelector(".text").innerText = userMessage;
  chatList.appendChild(outgoingMessageDiv);

  typingForm.reset(); //Clear input filed
  chatList.scrollTo(0,chatList.scrollHeight); //Scroll to the bottom
  document.body.classList.add("hide-header"); // hide the header once chat start
  setTimeout(showLoadinAnimation, 500); // show loading animatoin after a delay
  
};

// Set userMessage and handle outgoint chat when a suggestion is clicked
suggestions.forEach(suggestion => {
    suggestion.addEventListener("click",()=>{
       userMessage = suggestion.querySelector(".text").innerText;
       handleOutgoingChat();
    });
});

// toggle between light and dark themes s-2
toggleThemeButton.addEventListener("click", () => {
  const isLightMode = document.body.classList.toggle("light_mode");
  localStorage.setItem("themeColor", isLightMode ? "light_mode" : "dark_mode");
  toggleThemeButton.innerText = isLightMode ? "dark_mode" : "light_mode";
});

// Delete all chats from local storage when button is clicked
deleteChatButton.addEventListener("click",() =>{
    if(confirm("Are you sure you want to delete all messages?")){
        localStorage.removeItem("savedChats");
        loadLocalstorageData();
    }
})

// Prevent default form submission and handle outgoing chat
typingForm.addEventListener("submit", (e) => {
  e.preventDefault();

  handleOutgoingChat();
});

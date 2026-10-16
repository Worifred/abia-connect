const SUPABASE_URL = "https://lkxzaubfoahpoptlncvp.supabase.co/rest/v1/";
const SUPABASE_PUBLISHABLE_KEY = "sb_publishable_jPGrPlV54UFgBXT22CQ5JA_cDnDn67c";

let abiaSupabase = window.supabase.createClient(
  SUPABASE_URL,
  SUPABASE_PUBLISHABLE_KEY
);

const registrationForm = document.getElementById("registrationForm");
const registrationMessage = document.getElementById("registrationMessage");

registrationForm.addEventListener("submit", async function (event) {
  event.preventDefault();

  const fullName = document.getElementById("fullName").value.trim();
  const email = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value;
  const age = Number(document.getElementById("age").value);
  const gender = document.getElementById("gender").value;
  const location = document.getElementById("location").value;
  const abiaConnection = document.getElementById("abiaConnection").value; const aboutMe = document.getElementById("aboutMe").value.trim();
  if (age < 18) {
    registrationMessage.textContent =
      "You must be at least 18 years old to join Abia Connect.";
    return;
  }

  if (password.length < 8) {
    registrationMessage.textContent =
      "Your password must contain at least 8 characters.";
    return;
  }

  registrationMessage.textContent = "Creating your account...";

  try {
    const { data, error } = await 
    abiaSupabase.auth.signUp({
  email: email,
  password: password,
  options: {
  emailRedirectTo: "https://worifred.github.io/abia-connect/home.html",
  data: {
      full_name: fullName,
      age: age,
      gender: gender,
      location: location,
      abia_connection: abiaConnection,
      about_me: aboutMe
    }
  }
});


    if (error) throw error;
if (!data.session) {
  registrationMessage.textContent =
    "Account created! Please check your email and click the confirmation link.";
  return;
}
  if (data.user) {
  const { error: profileError } = await abiaSupabase
    .from("member_profiles")
    .insert({
      id: data.user.id,
      full_name: fullName,
      age: age,
      gender: gender,
      location: location,
      abia_connection: abiaConnection,
      about_me: aboutMe
    });

  if (profileError) throw profileError;

  registrationMessage.textContent =
    "Account created! Please check your email for a confirmation link.";
}
  } catch (error) {
    registrationMessage.textContent =
      "Registration could not be completed: " + error.message;
  }
});


const signInForm = document.getElementById("signInForm");
const signInMessage = document.getElementById("signInMessage");

signInForm.addEventListener("submit", async function (event) {
  event.preventDefault();

  const email = document.getElementById("signInEmail").value.trim();
  const password = document.getElementById("signInPassword").value;

  signInMessage.textContent = "Signing in...";

  try {
    const { data, error } = await abiaSupabase.auth.signInWithPassword({
      email: email,
      password: password
    });

    if (error) throw error;

    signInMessage.textContent = "Sign in successful! Opening your profile...";

    window.location.href = "https://worifred.github.io/abia-connect/home.html";
  } catch (error) {
    signInMessage.textContent = "Sign in failed: " + error.message;
  }
});

async function loadCommunityPosts() {
 const postsContainer = document.getElementById("communityFeed"); 

  if (!postsContainer) {
    console.log("Community posts container not found.");
    return;
  }

  postsContainer.textContent = "Loading posts...";

  const { data, error } = await abiaSupabase
    .from("community_posts")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Could not load posts:", error.message);
    postsContainer.textContent = "Could not load posts. Please try again later.";
    return;
  }

  postsContainer.replaceChildren();

  if (!data || data.length === 0) {
    postsContainer.textContent = "No community posts yet. Be the first to share!";
    return;
  }

  data.forEach((post) => {
    const postCard = document.createElement("div");
    postCard.className = "community-post";

    const postText = document.createElement("p");
    postText.textContent = post.content;

    const postDate = document.createElement("small");
    postDate.textContent = new Date(post.created_at).toLocaleString();

    postCard.append(postText, postDate);
    postsContainer.appendChild(postCard);
  });
}

const createPostForm = document.getElementById("createPostForm");

if (createPostForm) {
  createPostForm.addEventListener("submit", async function (event) {
    event.preventDefault();

    const postContent = document.getElementById("postContent");
    const postMessage = document.getElementById("postMessage");
    const content = postContent.value.trim();

    if (!content) {
      if (postMessage) postMessage.textContent = "Please write something first.";
      return;
    }

    if (postMessage) postMessage.textContent = "Publishing your post...";

    const { data: { user }, error: userError } =
      await abiaSupabase.auth.getUser();

    if (userError || !user) {
      if (postMessage) {
        postMessage.textContent = "Please sign in before publishing.";
      }
      return;
    }

    const { error } = await abiaSupabase
      .from("community_posts")
      .insert({
        user_id: user.id,
        content: content
      });

    if (error) {
      console.error("Could not publish post:", error.message);
      if (postMessage) {
        postMessage.textContent = "Post failed: " + error.message;
      }
      return;
    }

    postContent.value = "";
    if (postMessage) postMessage.textContent = "Your post was published!";
    await loadCommunityPosts();
  });
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", loadCommunityPosts);
} else {
  loadCommunityPosts();
}

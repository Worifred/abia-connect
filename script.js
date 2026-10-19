var ABIA_SUPABASE_URL = "https://lkxzaubfoahpoptlncvp.supabase.co";
var ABIA_SUPABASE_PUBLISHABLE_KEY =  "sb_publishable_jPGrPlV54UFgBXT22CQ5JA_cDnDn67c";

let abiaSupabase = window.supabase.createClient(
  ABIA_SUPABASE_URL,
  ABIA_SUPABASE_PUBLISHABLE_KEY
);

const registrationForm = document.getElementById("registrationForm");
const registrationMessage = document.getElementById("registrationMessage");

if (registrationForm) {
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
}


const signInForm = document.getElementById("signInForm");
const signInMessage = document.getElementById("signInMessage");

if (signInForm) {
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
}

async function loadCommunityPosts() {
  const postsContainer = document.getElementById("communityFeed");

  if (!postsContainer) {
    return;
  }

  postsContainer.textContent = "Loading posts...";

  const { data: posts, error } = await abiaSupabase
    .from("community_posts")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Could not load posts:", error.message);
    postsContainer.textContent = "Could not load posts. Please try again later.";
    return;
  }

  postsContainer.replaceChildren();

  if (!posts || posts.length === 0) {
    postsContainer.textContent = "No community posts yet. Be the first to share!";
    return;
  }

  for (const post of posts) {
    const postCard = document.createElement("div");
    postCard.className = "community-post";

    const authorName = document.createElement("a");
authorName.href = "profile.html?id=" + encodeURIComponent(post.user_id);
authorName.textContent = "Abia Connect Member";
authorName.style.color = "inherit";
authorName.style.textDecoration = "none";
authorName.style.fontWeight = "bold";

    const { data: profile } = await abiaSupabase
      .from("member_profiles")
      .select("full_name")
      .eq("id", post.user_id)
      .maybeSingle();

    if (profile && profile.full_name) {
      authorName.textContent = profile.full_name;
    }

    const postText = document.createElement("p");
    postText.textContent = post.content;

    const postDate = document.createElement("small");
    postDate.textContent = new Date(post.created_at).toLocaleString();

    
    // Add the post details
    postCard.append(authorName, postText, postDate);

    // Comments section
    const commentsSection = document.createElement("div");
    commentsSection.className = "post-comments";

    const commentsHeading = document.createElement("h4");
    commentsHeading.textContent = "Comments";

    const commentsList = document.createElement("div");
    commentsList.className = "comments-list";
    commentsList.textContent = "Loading comments...";

    const commentForm = document.createElement("form");
    commentForm.className = "comment-form";

    const commentInput = document.createElement("textarea");
    commentInput.placeholder = "Write a comment...";
    commentInput.maxLength = 1000;
    commentInput.required = true;
    commentInput.rows = 2;

    const commentButton = document.createElement("button");
    commentButton.type = "submit";
    commentButton.textContent = "Add Comment";

    const commentMessage = document.createElement("p");
    commentMessage.className = "comment-message";

    commentForm.append(commentInput, commentButton);
    commentsSection.append(
      commentsHeading,
      commentsList,
      commentForm,
      commentMessage
    );
    postCard.appendChild(commentsSection);
    postsContainer.appendChild(postCard);

    // Load comments for this post
    async function loadComments() {
      commentsList.textContent = "Loading comments...";

      const { data: comments, error } = await abiaSupabase
        .from("comments")
        .select("*")
        .eq("post_id", post.id)
        .order("created_at", { ascending: true });

      if (error) {
        console.error("Could not load comments:", error.message);
        commentsList.textContent = "Could not load comments.";
        return;
      }

      commentsList.replaceChildren();

      if (!comments || comments.length === 0) {
        commentsList.textContent = "No comments yet. Start the conversation!";
        return;
      }

      for (const comment of comments) {
        const commentCard = document.createElement("div");
        commentCard.className = "comment-item";

        const commentAuthor = document.createElement("strong");
        commentAuthor.textContent = "Abia Connect Member";

        const { data: commenter } = await abiaSupabase
          .from("member_profiles")
          .select("full_name")
          .eq("id", comment.user_id)
          .maybeSingle();

        if (commenter && commenter.full_name) {
          commentAuthor.textContent = commenter.full_name;
        }

        const commentText = document.createElement("p");
        commentText.textContent = comment.content;

        const commentDate = document.createElement("small");
        commentDate.textContent =
          new Date(comment.created_at).toLocaleString();

        commentCard.append(commentAuthor, commentText, commentDate);
        commentsList.appendChild(commentCard);
      }
    }

    // Save a new comment
    commentForm.addEventListener("submit", async function (event) {
      event.preventDefault();

      const content = commentInput.value.trim();

      if (!content) {
        commentMessage.textContent = "Please write a comment first.";
        return;
      }

      commentButton.disabled = true;
      commentMessage.textContent = "Posting your comment...";

      try {
        const {
          data: { user },
          error: userError
        } = await abiaSupabase.auth.getUser();

        if (userError || !user) {
          commentMessage.textContent =
            "Please sign in to comment.";
          return;
        }

        const { error } = await abiaSupabase
          .from("comments")
          .insert({
            post_id: post.id,
            user_id: user.id,
            content: content
          });

        if (error) {
          console.error("Could not save comment:", error.message);
          commentMessage.textContent =
            "Comment failed: " + error.message;
          return;
        }

        commentInput.value = "";
        commentMessage.textContent = "Comment added successfully!";
        await loadComments();
      } catch (error) {
        console.error("Comment error:", error);
        commentMessage.textContent =
          "Something went wrong. Please try again.";
      } finally {
        commentButton.disabled = false;
      }
    });

    await loadComments();

  }
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

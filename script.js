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

   
    // Post actions: Wow and Comment
    const postActions = document.createElement("div");
    postActions.className = "post-actions";

    const wowButton = document.createElement("button");
    wowButton.type = "button";
    wowButton.textContent = "❤️ Wow";
    wowButton.className = "wow-button";

    const wowCount = document.createElement("span");
    wowCount.className = "wow-count";

    const commentToggle = document.createElement("button");
    commentToggle.type = "button";
    commentToggle.textContent = "💬 Comment";
    commentToggle.className = "comment-toggle";

    postActions.append(wowButton, wowCount, commentToggle);

    // Comments stay hidden until Comment is clicked
    const commentsSection = document.createElement("div");
    commentsSection.className = "post-comments";
    commentsSection.hidden = true;

    const commentsList = document.createElement("div");
    commentsList.className = "comments-list";

    const commentForm = document.createElement("form");
    commentForm.className = "comment-form";

    const commentInput = document.createElement("textarea");
    commentInput.placeholder = "Write something about this post...";
    commentInput.maxLength = 1000;
    commentInput.required = true;
    commentInput.rows = 2;

    const commentButton = document.createElement("button");
    commentButton.type = "submit";
    commentButton.textContent = "Add Comment";

    const commentMessage = document.createElement("p");
    commentMessage.className = "comment-message";

    commentForm.append(commentInput, commentButton);
    commentsSection.append(commentsList, commentForm, commentMessage);

    postCard.append(postActions, commentsSection);
    postsContainer.appendChild(postCard);

    // Open or close the comment area
    commentToggle.addEventListener("click", async function () {
      commentsSection.hidden = !commentsSection.hidden;

      if (!commentsSection.hidden) {
        await loadComments();
      }
    });

    // Load saved Wow reactions
    async function loadWows() {
      const { count, error } = await abiaSupabase
        .from("post_wows")
        .select("*", { count: "exact", head: true })
        .eq("post_id", post.id);

      if (error) {
        console.error("Could not load Wow reactions:", error.message);
        wowCount.textContent = "";
        return;
      }

      wowCount.textContent = `${count || 0} Wows`;
    }

    // Add a Wow reaction
    wowButton.addEventListener("click", async function () {
      wowButton.disabled = true;

      try {
        const {
          data: { user },
          error: userError
        } = await abiaSupabase.auth.getUser();

        if (userError || !user) {
          alert("Please sign in to react to a post.");
          return;
        }

        const { data: existingWow, error: checkError } =
          await abiaSupabase
            .from("post_wows")
            .select("id")
            .eq("post_id", post.id)
            .eq("user_id", user.id)
            .maybeSingle();

        if (checkError) {
          console.error("Could not check Wow reaction:", checkError.message);
          alert("Could not check your reaction. Please try again.");
          return;
        }

        if (existingWow) {
          const { error } = await abiaSupabase
            .from("post_wows")
            .delete()
            .eq("id", existingWow.id);

          if (error) {
            console.error("Could not remove Wow:", error.message);
            alert("Could not update your reaction.");
            return;
          }
        } else {
          const { error } = await abiaSupabase
            .from("post_wows")
            .insert({
              post_id: post.id,
              user_id: user.id
            });

          if (error) {
            console.error("Could not save Wow:", error.message);
            alert("Could not save your reaction. Please try again.");
            return;
          }
          
if (post.user_id !== user.id) {
  const { error: notificationError } = await abiaSupabase
    .from("notifications")
    .insert({
      recipient_id: post.user_id,
      sender_id: user.id,
      type: "wow",
      post_id: post.id,
      message: "Someone gave your post a Wow!"
    });

  if (notificationError) {
    console.error("Wow notification failed:", notificationError.message);
  }
}

        }

        await loadWows();
      } finally {
        wowButton.disabled = false;
      }
    });

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
          commentMessage.textContent = "Please sign in to comment.";
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
          commentMessage.textContent = "Comment failed: " + error.message;
          return;
        }
        
if (post.user_id !== user.id) {
  const { error: notificationError } = await abiaSupabase
    .from("notifications")
    .insert({
      recipient_id: post.user_id,
      sender_id: user.id,
      type: "comment",
      post_id: post.id,
      message: "Someone commented on your post!"
    });

  if (notificationError) {
    console.error("Comment notification failed:", notificationError.message);
  }
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

    await loadWows();


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


async function loadNotifications() {
  const notificationsList = document.getElementById("notificationsList");

  if (!notificationsList) return;

  const {
    data: { user },
    error: userError
  } = await abiaSupabase.auth.getUser();

  if (userError || !user) {
    notificationsList.textContent = "Please sign in to view your notifications.";
    return;
  }

  notificationsList.textContent = "Loading notifications...";

  const { data: notifications, error } = await abiaSupabase
    .from("notifications")
    .select("id, sender_id, type, post_id, message, is_read, created_at")
    .eq("recipient_id", user.id)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Could not load notifications:", error.message);
    notificationsList.textContent = "Could not load notifications. Please try again later.";
    return;
  }

  notificationsList.replaceChildren();

  if (!notifications || notifications.length === 0) {
    notificationsList.textContent = "You have no notifications yet.";
    return;
  }

  for (const notification of notifications) {
    const item = document.createElement("div");
    item.className = "notification-item";

    const message = document.createElement("p");
    message.textContent = notification.message;

    const date = document.createElement("small");
    date.textContent = new Date(notification.created_at).toLocaleString();

    if (!notification.is_read) {
      item.style.fontWeight = "bold";
    }

    item.append(message, date);
    notificationsList.appendChild(item);
  }
}

async function loadFriends() {
  const friendsList = document.getElementById("friendsList");
  const friendsMessage = document.getElementById("friendsMessage");

  if (!friendsList) return;

  friendsList.replaceChildren();

  if (friendsMessage) {
    friendsMessage.textContent = "Loading Abia Connect members...";
  }

  const {
    data: { user },
    error: userError
  } = await abiaSupabase.auth.getUser();

  if (userError || !user) {
    if (friendsMessage) {
      friendsMessage.textContent = "Please sign in to discover members.";
    }
    return;
  }

  const { data: profiles, error } = await abiaSupabase
    .from("member_profiles")
    .select("id, full_name, age, gender, location, abia_connection, about_me")
    .neq("id", user.id)
    .order("full_name", { ascending: true });

  if (error) {
    console.error("Could not load members:", error.message);

    if (friendsMessage) {
      friendsMessage.textContent =
        "Could not load members. We may need to check the profile viewing permissions.";
    }
    return;
  }

  if (!profiles || profiles.length === 0) {
    if (friendsMessage) {
      friendsMessage.textContent =
        "No other member profiles are available yet.";
    }
    return;
  }

  if (friendsMessage) {
    friendsMessage.textContent =
      profiles.length + " other member(s) in Abia Connect";
  }

  profiles.forEach(function (profile) {
    const card = document.createElement("article");
    card.className = "friend-card";

    const name = document.createElement("h3");
    name.textContent = profile.full_name || "Abia Connect Member";

    const details = document.createElement("p");
    const detailParts = [];

    if (profile.age) detailParts.push(profile.age);
    if (profile.gender) detailParts.push(profile.gender);
    if (profile.location) detailParts.push(profile.location);

    details.textContent = detailParts.join(" · ");

    const connection = document.createElement("p");
    connection.textContent = profile.abia_connection
      ? "Abia connection: " + profile.abia_connection
      : "";

    const about = document.createElement("p");
    about.textContent = profile.about_me || "This member hasn't added an introduction yet.";

    const viewButton = document.createElement("a");
    viewButton.href = "profile.html?id=" + encodeURIComponent(profile.id);
    viewButton.textContent = "View Profile";
    viewButton.className = "primary-button";

    card.append(name, details, connection, about, viewButton);
    friendsList.appendChild(card);
  });
}

async function loadMyProfile() {
  const profileMessage = document.getElementById("myProfileMessage");

  if (!profileMessage) return;

  profileMessage.textContent = "Loading your profile...";

  const {
    data: { user },
    error: userError
  } = await abiaSupabase.auth.getUser();

  if (userError || !user) {
    profileMessage.textContent = "Please sign in to view your profile.";
    return;
  }

  const { data: profile, error } = await abiaSupabase
    .from("member_profiles")
    .select("full_name, age, gender, location, abia_connection, about_me")
    .eq("id", user.id)
    .maybeSingle();

  if (error) {
    console.error("Could not load your profile:", error.message);
    profileMessage.textContent =
      "Could not load your profile. Please try again later.";
    return;
  }

  if (!profile) {
    profileMessage.textContent =
      "Your profile details are not available yet.";
    return;
  }

  document.getElementById("myProfileName").textContent =
    profile.full_name || "Not provided";
  document.getElementById("myProfileAge").textContent =
    profile.age ?? "Not provided";
  document.getElementById("myProfileGender").textContent =
    profile.gender || "Not provided";
  document.getElementById("myProfileLocation").textContent =
    profile.location || "Not provided";
  document.getElementById("myProfileConnection").textContent =
    profile.abia_connection || "Not provided";
  document.getElementById("myProfileAbout").textContent =
    profile.about_me || "Not provided";

  profileMessage.textContent = "";
}


async function setupMyProfileEditor() {
  const editButton = document.getElementById("homeEditProfileButton");
  const editForm = document.getElementById("homeEditProfileForm");
  const editMessage = document.getElementById("homeEditMessage");

  if (!editButton || !editForm || !editMessage) return;

  const { data: { user }, error: userError } =
    await abiaSupabase.auth.getUser();

  if (userError || !user) {
    editMessage.textContent = "Please sign in to edit your profile.";
    editButton.disabled = true;
    return;
  }

  const { data: profile, error } = await abiaSupabase
    .from("member_profiles")
    .select("full_name, age, gender, location, abia_connection, about_me")
    .eq("id", user.id)
    .maybeSingle();

  if (error || !profile) {
    editMessage.textContent = "Could not load your profile for editing.";
    console.error("Profile editor loading error:", error);
    return;
  }

  document.getElementById("homeEditName").value =
    profile.full_name || "";
  document.getElementById("homeEditAge").value =
    profile.age ?? "";
  document.getElementById("homeEditGender").value =
    profile.gender || "";
  document.getElementById("homeEditLocation").value =
    profile.location || "";
  document.getElementById("homeEditConnection").value =
    profile.abia_connection || "";
  document.getElementById("homeEditAbout").value =
    profile.about_me || "";

  
editButton.addEventListener("click", async function () {
  const { data: { user: currentUser } } =
    await abiaSupabase.auth.getUser();

  if (!currentUser) {
    editMessage.textContent = "Please sign in again.";
    return;
  }

  const { data: limit, error: limitError } = await abiaSupabase
    .from("profile_edit_limits")
    .select("last_edited_at")
    .eq("user_id", currentUser.id)
    .maybeSingle();

  if (limitError) {
    console.error("Edit limit check failed:", limitError);
    editMessage.textContent =
      "Could not check your profile editing limit. Please try again.";
    return;
  }

  if (limit && limit.last_edited_at) {
    const nextEditDate = new Date(limit.last_edited_at);
    nextEditDate.setDate(nextEditDate.getDate() + 60);

    if (new Date() < nextEditDate) {
      editMessage.textContent =
        "You can edit your profile again on " +
        nextEditDate.toLocaleDateString() + ".";
      return;
    }
  }

  editForm.hidden = !editForm.hidden;
  editMessage.textContent = "";
  editButton.textContent = editForm.hidden
    ? "✏️ Edit My Profile"
    : "✖ Close Edit Profile";
});


  editForm.addEventListener("submit", async function (event) {
    event.preventDefault();

    editMessage.textContent = "Saving your changes...";

    const updates = {
      full_name: document.getElementById("homeEditName").value.trim(),
      age: Number(document.getElementById("homeEditAge").value),
      gender: document.getElementById("homeEditGender").value.trim(),
      location: document.getElementById("homeEditLocation").value.trim(),
      abia_connection: document.getElementById("homeEditConnection").value.trim(),
      about_me: document.getElementById("homeEditAbout").value.trim()
    };

    const { data: savedProfile, error: saveError } = await abiaSupabase
      .from("member_profiles")
      .update(updates)
      .eq("id", user.id)
      .select("id");

    if (saveError || !savedProfile || savedProfile.length === 0) {
      console.error("Profile save error:", saveError);
      editMessage.textContent =
        "Could not save changes. Please try again.";
      return;
    }

    const { error: limitSaveError } = await abiaSupabase
      .from("profile_edit_limits")
      .upsert(
        {
          user_id: user.id,
          last_edited_at: new Date().toISOString()
        },
        { onConflict: "user_id" }
      );

    if (limitSaveError) {
      console.error("Could not save edit limit:", limitSaveError);
      editMessage.textContent =
        "Your profile changed, but the 60-day limit could not be saved. Please contact support.";
      return;
    }

    editMessage.textContent = "Profile updated successfully!";
    editForm.hidden = true;
    editButton.textContent = "✏️ Edit My Profile";

    await loadMyProfile();
  });
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", function () {
    loadCommunityPosts();
    loadNotifications();
    loadFriends();
    loadMyProfile();
    setupMyProfileEditor();
  });
} else {
  loadCommunityPosts();
  loadNotifications();
  loadFriends();
  loadMyProfile();
  setupMyProfileEditor();
}

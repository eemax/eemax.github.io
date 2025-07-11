**Best Practice for Adding PATH in Fish**

  

Use the fish_user_paths universal variable. This is cleaner, avoids manual file editing, and integrates with Fish’s configuration system.

  

**Steps to Permanently Add to PATH Using fish_user_paths:**

1. Open a Fish shell.

2. Add your directory to the fish_user_paths variable:

  


```
set -U fish_user_paths /Users/ml/.local/bin $fish_user_paths
```

  

• -U: Sets a universal variable, which persists across sessions.

• $fish_user_paths: Appends the new directory to the existing entries, if any.

  

3. Verify the change:

  

```
echo $PATH
```

  

Your new path should now appear at the beginning of the PATH.

  

**Why This is Better:**

• **Modular Configuration**: It keeps your config.fish file cleaner.

• **Ease of Maintenance**: You can update or remove fish_user_paths using the set command without editing files directly.

• **Safe Overrides**: It only prepends to PATH, ensuring it won’t conflict with existing system configurations.

  

**If You Still Prefer config.fish:**

  

Adding set -x PATH ... to your config.fish is perfectly fine for small setups or temporary configurations. However, for larger or shared setups, the fish_user_paths method is recommended.
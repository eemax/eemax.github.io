## Clone Git bare repo in home dir
1. Clone bare git repo into $HOME/config
```
git clone --bare https://github.com/eemax/config.git $HOME/config
```
2. Don't show untracked files, auto setup remote origin/main
```
git --git-dir=$HOME/config --work-tree=$HOME config --local status.showUntrackedFiles no
git --git-dir=$HOME/config --work-tree=$HOME config --local push.autoSetupRemote true
```
3. Checkout config into home dir
```
git --git-dir=$HOME/config --work-tree=$HOME checkout
```
4. Add Git credentials
```
read -p "GitHub PAT:" PAT && echo "https://eemax:$PAT@github.com" > .git-credentials
```
## Install essentials
1. Install Rust
```
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh

```
- export rust path

2. Install Bun

```
curl -fsSL https://bun.sh/install | bash
```
3. Install Homebrew
```
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
```
4. Install Homebrew packages
```
brew bundle install
```
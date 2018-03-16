# cnyhacks
CNY Hackathon Web CTF

## Set Up

Running cnyhacks is just like running any other NPM app, but here's the copy-paste verison:
```bash
# Install git lfs if you don't have it (https://github.com/git-lfs/git-lfs/wiki/Installation)
curl -s https://packagecloud.io/install/repositories/github/git-lfs/script.deb.sh | sudo bash
sudo apt-get install git-lfs
git lfs install

# Initialize Git LFS ( Required to pull binary files - get it from https://github.com/git-lfs/git-lfs/ )
git lfs install

# Clone Repo
git clone git@gitlab.com:CNYHackathon/ctf/cnyhacks.git
cd cnyhacks

# Checkout relevant branch
git checkout master

# Install NPM Dependencies
npm install

# Run it!
npm start
```

## Development

To begin developing, first follow all the steps defined in Set Up. Some things to note for development:
- Recommended IDE is [WebStorm](https://www.jetbrains.com/webstorm/) - Free to students, 
    worth the price for professionals
- There are two databases:
    - `<config.ProjectName>.db` - Production DB, and is committed to the repo
    - `<config.ProjectName>_DEV.db` - Development DB, **NEVER** committed to the repo.
                                      You may copy the prod DB to have a place to start
=======

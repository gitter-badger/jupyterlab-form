# JupyterLab Form


[![Join the chat at https://gitter.im/simonbiggs/jupyterlab-form](https://badges.gitter.im/simonbiggs/jupyterlab-form.svg)](https://gitter.im/simonbiggs/jupyterlab-form?utm_source=badge&utm_medium=badge&utm_campaign=pr-badge&utm_content=badge)

An extension for jupyterlab to create scripted forms.

## Requirements

Aquire Python3, JupyterLab, Node, npm, and git.

One way to get these, which is simple and platform independent, is to download miniconda from https://conda.io/miniconda.html, install it, and then run the following:

```bash
conda install nodejs jupyterlab git -c conda-forge
```

I personally use Ubuntu and install node and npm via nvm (https://github.com/creationix/nvm), python3 with pyenv (https://github.com/pyenv/pyenv), and jupyterlab simply via pip as so:

```bash
pip install jupyterlab
```

## Installation

Once you have those requirements download and install jupyrerlab-forms by running the following:

```bash
git clone https://github.com/SimonBiggs/jupyterlab-form
cd jupyterlab-form
npm install
jupyter labextension install
jupyter lab
```

Then within the `launcher` tab press the `Form` button.

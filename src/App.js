import React, { Component } from 'react';
import Markdown from 'markdown-to-jsx';
import AceEditor from 'react-ace';
import styled from 'styled-components';
import dateFns from 'date-fns';
import brace from 'brace';
import 'brace/mode/markdown';
import 'brace/theme/dracula';
import logo from './Logo.png';
import './App.css';

const { ipcRenderer } = window.require('electron');
const settings = window.require('electron-settings');
const fs = window.require('fs');
const formatDate = date => dateFns.format(new Date(date), 'MMMM Do YYYY');

class App extends Component {
    state = {
        loadedFile: '',
        filesData: [],
        activeIndex: 0,
        newEntry: false,
        newEntryName: '',
        directory: settings.get('directory') || null,
    };

    constructor() {
        super();

        const directory = settings.get('directory');
        if (directory) {
            this.loadAndReadFiles(directory);
        }

        ipcRenderer.on('save-file', event => {
            this.saveFile();
        });

        ipcRenderer.on('new-dir', (event, directory) => {
            this.setState({
                directory,
            });
            settings.set('directory', directory);
            this.loadAndReadFiles(directory);
        });
    }

  loadAndReadFiles = directory => {
  (

      fs.readdir(directory, (err, files) => {
          const filteredFiles = files.filter(file => file.includes('.md'));
          const filesData = filteredFiles.map(file => {
              const date = file.substr(
                  file.indexOf('_') + 1,
                  file.indexOf('.') - file.indexOf('_') - 1,
              );
              return {
                date,
                path: `${directory}/${file}`,
                title: file.substr(0, file.indexOf('_')),
            };
          });

          filesData.sort((a, b) => {
              const aDate = new Date(a.date);
              const bDate = new Date(b.date);
              const aSec = aDate.getTime();
              const bSec = bDate.getTime();
              return bSec - aSec;
          });

          this.setState({
              filesData,
          },
          () => this.loadFile(0));
      })
  );
};

  changeFile = index => () => {
      const { activeIndex } = this.state;
      if (index !== activeIndex) {
          this.saveFile();
          this.loadFile(index);
      }
  };

  loadFile = index => {
      const { filesData } = this.state;

      const content = fs.readFileSync(filesData[index].path).toString();

      this.setState({
          loadedFile: content,
          activeIndex: index,
      });
  };

  saveFile = () => {
      const { activeIndex, loadedFile, filesData } = this.state;
      fs.writeFile(filesData[activeIndex].path, loadedFile, err => {
          if (err) return console.log(err);
      });
  };

  newFile = e => {
      e.preventDefault();
      const { newEntryName, directory, filesData } = this.state;
      const fileDate = dateFns.format(new Date(), 'MM-DD-YYYY');
      const filePath = `${directory}/${newEntryName}_${fileDate}.md`;
      fs.writeFile(filePath, '', err => {
          if (err) return console.log(err);

          filesData.unshift({
              path: filePath,
              date: fileDate,
              title: newEntryName,
          });

          this.setState({
              newEntry: false,
              newEntryName: '',
              loadedFile: '',
              filesData,
          });
      });
  };

  render() {
    const {
        activeIndex, filesData, directory, loadedFile, newEntry, newEntryName,
    } = this.state;
    return (
      <div className="App">
        <Header>DOPE NOTES</Header>
        <header className="App-header">
          <img src={logo} className="App-logo" alt="logo" />
        </header>
        {directory ? (
          <Split>
            <AppWrap>
              <FilesWindow>
              <Button
                onClick={() => this.setState({newEntry: !newEntry})}
              >
              + New File
              </Button>
              {newEntry && (
                <form onSubmit={this.newFile}>
                    <input
                      value={newEntryName}
                      onChange={e =>
                        this.setState({ newEntryName: e.target.value })
                      }
                      autoFocus
                      type="text"
                    />
                </form>
            )}
                {filesData.map((file, index) => (
                      <FileButton
                        active={activeIndex === index}
                        onClick={this.changeFile(index)}
                      >
                        <p className="title">{file.title}</p>
                        <p className="date">{formatDate(file.date)}</p>
                      </FileButton>
                ))}
              </FilesWindow>
            </AppWrap>
            <CodeWindow>
              <AceEditor
                mode="markdown"
                theme="dracula"
                onChange={(newContent) => {
                    this.setState({
                        loadedFile: newContent,
                    });
                }}
                name="markdown_editor"
                value={loadedFile}
              />
            </CodeWindow>
            <RenderedWindow>
              <Markdown>{loadedFile}</Markdown>
            </RenderedWindow>
          </Split>
      ) : (
          <LoadingMessage>
            <h1> Press Cmd + O to open directory </h1>
          </LoadingMessage>
    )}
      </div>
    );
  }
}

export default App;

const AppWrap = styled.div`
    width: 200px;
    position: relative;
    background: #c2cad0;
`;

const Header = styled.header`
    background-color: #3d344b;
    color: #f4f2f3;
    font-size: 0.8rem;
    font-weight: bold;
    height: 23px;
    text-align: center;
    position: fixed;
    box-shadow: 0px 3px 3px rgba(0,0,0,0.2);
    top: 0;
    left: 0;
    width: 100%;
    z-index: 10;
    -webkit-app-region: drag;
`;

const LoadingMessage = styled.div`
    display: flex;
    justify-content: center;
    align-items: center;
    color: #f4f2f3;
    background: #3d344b;
    height: 100vh;
`;

const Split = styled.div`
    display: flex;
    height: 100vh;
`;

const RenderedWindow = styled.div`
    background-color: #c2cad0;
    width: 35%;
    padding: 20px;
    color: #3d344b;
    border-left: 1px solid #1d1f21;
    h1, h2, h3, h4, h5, h6 {
        color: #f51752;
    }
    h1 {
        border-bottom: solid 3px #f51752;
        padding-bottom: 10px;
    }
    a {
        color: #66fcf1;
    }
`;

const FilesWindow = styled.div`
    background: #c2cad0;
    border-right: solid 1px #1d1f21;
    position: relative;
    width: 100%;
    &:after {
        content: '';
        position: absolute;
        left: 0;
        right: 0;
        top: 0;
        bottom: 0;
        pointer-events: none;
        box-shadow: -10px 0 20px rgba(0, 0, 0, 0.3) inset;
    }
`;

const CodeWindow = styled.div`
    flex: 1;
`;

const FileButton = styled.button`
    appearance: none;
    padding: 10px;
    width: 100%;
    background: #1f2833;
    text-align: left;
    opacity: 0.4;
    color: #66fcf1;
    border: none;
    border-bottom: solid 1px #bea6ff;
    transition: 0.3s ease all;
    &:hover {
        opacity: 1;
        border-left: solid 4px #3d344b;
    }
    ${({ active }) => active && `
        opacity: 1;
        border-left: solid 4px #3d344b;
    `};
    .title {
        font-weight: bold;
        font-size: 0.9rem;
        margin: 0 0 5px;
    }
    .date {
        margin: 0;
    }
`;

const Button = styled.button`
    background: transparent;
    color: #1f2833;
    display: block;
    border: solid 1px #66fcf1;
    border-radius: 4px;
    margin: 1rem auto;
    font-size: 1rem;
    transition: 0.3s ease all;
    padding: 5px 10px;
    &:hover {
        background: #66fcf1;
        color: #3d344b;
    }
`;

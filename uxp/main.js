/*



Rekam ~ Timelapse plugins for Photoshop
written by eto satrio ( @armsaroundmyknees )
armsaroundmyknees.github.io/rekam
january 2024



*/

// module variables
// ________________________________________________________________________

const ps = require("photoshop");
const bp = ps.action.batchPlay;
const app = ps.app;
const core = ps.core;
const imaging = require("photoshop").imaging;

const uxp = require("uxp");
const uxpfs = uxp.storage.localFileSystem;
const uxpcore = require("uxp").core;
const uxpshell = require("uxp").shell;
const uxpstorage = require("uxp").storage;

const fs = require("fs");
const os = require("os");

// entrypoints setup
// ________________________________________________________________________

const { entrypoints } = uxp;

let chooseOutputFolderEntry = () => {
  rekamButtons.selectFolder.click();
};

let actReloadPlugins = () => {
  location.reload();
  fetchDocument();
};

entrypoints.setup({
  commands: {
    chooseOutputFolderEntry,
    actReloadPlugins,
    openDevHomepage,
  },
  panels: {
    vanilla: {
      show(node) {},
    },
  },
});

// app variables
// ________________________________________________________________________

let deviceInfo = {
  os: os.platform(),
  arch: os.arch(),
};

let rekamButtons = {
  start: document.getElementById("buttonStart"),
  stop: document.getElementById("buttonStop"),
  openFolder: document.getElementById("openOutputFolder"),
  selectFolder: document.getElementById("chooseOutputFolder"),
  videoResolution: document.getElementById("selectVideoRes"),
  videoDuration: document.getElementById("selectVideoDuration"),
  exportVideo: document.getElementById("exportToVideo"),
};

let rekamInfos = {
  rekamMetas: document.getElementById("rekamMetas"),
  folder: document.getElementById("infoFolder"),
  status: document.getElementById("infoStatus"),
  status2: document.getElementById("infoStatus2"),
  reloadPlugins: document.getElementById("reloadPlugins"),
  currentActiveDoc: document.getElementById("infoCurrentActiveDoc"),
};

const resolutonInfo = document.querySelector(".cantchoose");

// entry variables
// ________________________________________________________________________
let chosenFolderEntry;
let chosenFolderEntryToken;
// let chosenFolderOutputEntry;

let currentRecordedDocID = "none";
let currentRecordedDocName = "none";

let lastNumberPosition = 0;
let nextNumberPosition;
let currentDocumentStarted = "none";

let lastFrameFromExportLists;
let toBeExportedFramesAmount = "none";

// document variable
// ________________________________________________________________________
let thisDocument = {};

// fungsi fetch Document Info
// ________________________________________________________________________
function fetchDocument() {
  thisDocument = {
    obj: app.activeDocument,
    file: app.activeDocument.name,
    name: app.activeDocument.name.replace(/\.[^.]*$/, ""),
    h: app.activeDocument.height,
    w: app.activeDocument.width,
    id: app.activeDocument.id,
  };
}

//
// getPluginFolder
getPluginDir();

// fungsi get plugins directory
// ________________________________________________________________________
async function getPluginDir() {
  let results = await uxpfs.getPluginFolder().then((s) => s);
  let results2 = await uxpfs.getDataFolder().then((s) => s);

  rekamConfig.pluginDir = results;
  rekamConfig.pluginDataDir = results2;

  await fs
    .lstat("plugin-data:/Rekam_scripts/")
    .then((exists) => {
      rekamConfig.pluginDataDir.getEntry("Rekam_scripts").then((s) => {
        rekamConfig.pluginScriptsDataDir = s;
      });
    })
    .catch((notExists) => {
      rekamConfig.pluginDataDir.createFolder("Rekam_scripts").then((s) => {
        rekamConfig.pluginScriptsDataDir = s;
      });
    });

  // rekamInfos.status2.innerText =
  //   "(plugin folder: " + rekamConfig.pluginDir + ")";
  rekamInfos.status2.innerText = "";
  return "ok!";
}

// fungsi open developer website / homepage
// ________________________________________________________________________
function openDevHomepage() {
  uxpshell.openExternal("https://armsaroundmyknees.gumroad.com/l/rekam");
}

// fungsi check active document
// ________________________________________________________________________
function checkActiveDocument() {
  if (app.activeDocument === null) {
    core.showAlert("You can only use this plugins when document is opened...");
    return true;
  } else {
    return false;
  }
}

// fungsi select folder
// ________________________________________________________________________
async function actSelectFolder() {
  if (checkActiveDocument() === false) {
    await fetchDocument();

    await uxpfs
      .getFolder()
      .then((result) => {
        chosenFolderEntry = result;
        chosenFolderEntryToken = uxpfs.createSessionToken(chosenFolderEntry);

        /** 
        chosenFolderEntry
          .createFolder(rekamConfig.suffix + "_" + thisDocument.name)
          .then((s) => {
            chosenFolderOutputEntry = s;
          })
          .catch((e) => {
            chosenFolderEntry.getEntries().then((e) => {
              chosenFolderOutputEntry = e.find((entry) => {
                let results = entry.name.includes(
                  rekamConfig.suffix + "_" + thisDocument.name
                );
                return results;
              });
            });
          });

          */

        rekamButtons.start.disabled = false;
        rekamButtons.openFolder.disabled = false;
        rekamButtons.exportVideo.disabled = false;

        rekamInfos.folder.innerHTML = `(output folder: ${result.nativePath})`;
        rekamInfos.status.innerHTML = `click start to run a record session... `;
        currentDocumentStarted = "none";

        // checkOutputFolder();
      })
      .catch((error) => {
        chosenFolderEntry = undefined;
        chosenFolderEntryToken = undefined;
        console.error("Rekam " + error);

        rekamButtons.start.disabled = true;
        rekamButtons.openFolder.disabled = true;
        rekamButtons.exportVideo.disabled = true;

        rekamInfos.folder.innerHTML = `(output folder: none)`;
        rekamInfos.status.innerHTML = `failed to set a folder.. try again.`;
        currentDocumentStarted = "none";
      });
  }
}

// fungsi open output folder
// ________________________________________________________________________

function actOpenOutputFolder() {
  uxpshell.openPath(chosenFolderEntry.nativePath);
}

// fungsi recording session
// ________________________________________________________________________

/** 
// recording session act
function recordingSessionAction(act) {
  if (act === "create") {
    //
    let intervalCount = 0;
    //
    recordingSession = setInterval(
      () => {
        intervalCount++;

        exportJPG(intervalCount++);
      },
      //
      1000 * rekamConfig.interval
    );
    //
  }

  if (act === "destroy") {
    clearInterval(recordingSession);
  }
}
*/

// start
function startRecording(message) {
  fetchDocument();

  currentRecordedDocID = thisDocument.id;
  currentRecordedDocName = thisDocument.name;

  createExportFolder();
  // currentDocumentStarted = "none";
  // dom manipulation

  rekamButtons.start.disabled = true;
  rekamButtons.stop.disabled = false;
  rekamButtons.selectFolder.disabled = true;
  rekamButtons.exportVideo.disabled = true;
  rekamButtons.videoDuration.disabled = true;
  rekamButtons.videoResolution.disabled = true;

  rekamInfos.status.innerText = ` ${currentRecordedDocName} (id: ${currentRecordedDocID}) is being recorded.`;
  // rekamInfos.currentRecordedDoc.innerText = `(recorded document: ${currentRecordedDocName} (id: ${currentRecordedDocID})`;

  // main function
  // recordingSessionAction("create");
  ps.action.addNotificationListener(["historyStateChanged"], historyListener);
  return message;
}

// stop
function stopRecording(message) {
  // dom manipulation
  rekamInfos.status.innerText = message;
  rekamButtons.start.disabled = false;
  rekamButtons.stop.disabled = true;
  rekamButtons.videoResolution.disabled = false;
  rekamButtons.selectFolder.disabled = false;
  rekamButtons.exportVideo.disabled = false;
  rekamButtons.videoDuration.disabled = false;
  rekamButtons.videoResolution.disabled = false;

  currentRecordedDocID = "none";
  currentRecordedDocName = "none";

  // main function
  // recordingSessionAction("destroy");
  ps.action.removeNotificationListener(
    ["historyStateChanged"],
    historyListener
  );
  return message;
}

// fungsi document switch listener
// ________________________________________________________________________

function documentSwitchListener(event, descriptor) {
  // let historyAct = JSON.stringify(descriptor);
  // location.reload();
  // fetchDocument();
  rekamInfos.currentActiveDoc.innerText = `(active document: ${app.activeDocument.name} (id: ${app.activeDocument.id})`;
  // console.log("documentSwitchListener");
  // console.log(historyAct);
  // console.log(app.activeDocument.name);
}

// fungsi history listener
// ________________________________________________________________________
function historyListener(event, descriptor) {
  let historyAct = JSON.stringify(descriptor.name);

  if (app.activeDocument.id === thisDocument.id) {
    if (historyAct == '"Select Canvas"') {
      // console.log(`${historyAct} will not be recorded.`);
    } else {
      // console.log("Event: " + event + " Descriptor: " + historyAct);
      exportJPG();
      // console.log(currentRecordedDocName);
    }
    // console.log("history listener active to this document");
  } else {
    // console.log("this is not recorded document");
  }
}

// fungsi resize document listener
// ________________________________________________________________________
function recordedDocResizedListener(event, descriptor) {
  if (app.activeDocument.id === thisDocument.id) {
    fetchDocument();
    // console.log("recorded doc resized");
  }
}

// fungsi add padding number
// ________________________________________________________________________
function addPad(number) {
  return number.toString().padStart(rekamConfig.zeroPad, "0");
}

// fungsi create export folder
// ________________________________________________________________________

async function createExportFolder() {
  let subdir = `${rekamConfig.suffix}_${currentRecordedDocName}`;
  let subdirEntry;

  await chosenFolderEntry
    .getEntries()
    .then((s) => s)
    .then((s2) => {
      subdirEntry = s2.find((o) => o.name === subdir);
    })
    .catch(
      chosenFolderEntry.createFolder(subdir).then((s) => {
        subdirEntry = s;
        return s;
      })
    );

  // console.log(subdirEntry);
}

// exportJPG via save bp
// ________________________________________________________________________

async function exportJPG() {
  // await fetchDocument();

  if (currentDocumentStarted === app.activeDocument.name) {
    lastNumberPosition = nextNumberPosition;
    nextNumberPosition = lastNumberPosition + 1;
  } else {
    await checkOutputFolder();
    currentDocumentStarted = currentRecordedDocName;
  }

  let subdir = `${rekamConfig.suffix}_${currentRecordedDocName}`;
  let filename = `${currentRecordedDocName}_${rekamConfig.suffix}_${addPad(
    nextNumberPosition
  )}.jpg`;

  let subdirEntry;
  let newFileNameEntry;
  let newFileNameEntryToken;

  await chosenFolderEntry
    .getEntries()
    .then((s) => s)
    .then((s2) => {
      subdirEntry = s2.find((o) => o.name === subdir);
    })
    .catch(
      chosenFolderEntry.createFolder(subdir).then((s) => {
        subdirEntry = s;
        return s;
      })
    );

  // console.log(subdirEntry);

  await subdirEntry.createFile(filename).then((s) => {
    newFileNameEntry = s;
    newFileNameEntryToken = uxpfs.createSessionToken(s);
    return s;
  });

  // console.log(newFileNameEntry);
  // console.log(newFileNameEntryToken);

  await core.executeAsModal(
    () => {
      bp(
        [
          {
            _obj: "save",
            as: {
              _obj: "JPEG",
              extendedQuality: rekamConfig.jpegQuality,
              matteColor: {
                _enum: "matteColor",
                _value: "none",
              },
            },
            in: {
              _path: newFileNameEntryToken,
              _kind: "local",
            },
            documentID: thisDocument.id,
            copy: true,
            lowerCase: true,
            saveStage: {
              _enum: "saveStageType",
              _value: "saveBegin",
            },
            _options: {
              dialogOptions: "dontDisplay",
            },
          },
        ],
        {
          synchronousExecution: false,
        }
      );
    },
    { commandName: "records export img", interactive: true }
  );

  // console.log(subdir);
  // console.log(filename);
}

/** 
// fungsi export JPG via video export
// ________________________________________________________________________

async function exportJPG2() {
  if (currentDocumentStarted === app.activeDocument.name) {
    lastNumberPosition = nextNumberPosition;
    nextNumberPosition = lastNumberPosition + 1;
  } else {
    await checkOutputFolder();
    currentDocumentStarted = currentRecordedDocName;
  }

  // if (currentDocumentStarted === "none") {
  //   await checkOutputFolder();
  // } else {
  //   lastNumberPosition = nextNumberPosition;
  //   nextNumberPosition = lastNumberPosition + 1;
  // }

  // let acak = Math.floor(Math.random() * 100) + 1;
  let subdir = `${rekamConfig.suffix}_${thisDocument.name}`;
  let filename = `${thisDocument.name}_${rekamConfig.suffix}_${addPad(
    nextNumberPosition
  )}.jpg`;

  await core.executeAsModal(
    () => {
      bp(
        [
          {
            _obj: "export",
            using: {
              _obj: "videoExport",
              directory: {
                _path: chosenFolderEntryToken,
                _kind: "local",
              },
              subdirectory: subdir,
              name: filename,
              sequenceRenderSettings: {
                _obj: "sequenceRenderSettings",
                as: {
                  _obj: "JPEG",
                  extendedQuality: rekamConfig.jpegQuality,
                  matteColor: {
                    _enum: "matteColor",
                    _value: "none",
                  },
                },
              },
              minDigits: rekamConfig.zeroPad,
              startNumber: 0,
              useDocumentSize: true,
              useDocumentFrameRate: true,
              allFrames: true,
              renderAlpha: {
                _enum: "alphaRendering",
                _value: "straight",
              },
              quality: 1,
              Z3DPrefHighQualityErrorThreshold: 5,
            },
            _isCommand: true,
          },
        ],
        {}
      );
    },
    { commandName: "records export img", interactive: true }
  );

  // console.log(subdir);
  // console.log(filename);
}

*/

// fungsi check output folder
// ________________________________________________________________________

async function checkOutputFolder() {
  let currentActiveOutDirName = `${rekamConfig.suffix}_${thisDocument.name}`;

  let currentActiveOutDirEntry = await chosenFolderEntry
    .getEntry(currentActiveOutDirName)
    .then((succ) => succ);

  foundLastFile = await fs.readdir(currentActiveOutDirEntry);

  currentDocumentStarted = currentRecordedDocName;

  // if (currentDocumentStarted === app.activeDocument.name) {
  //   currentDocumentStarted = app.activeDocument.name;
  //   lastNumberPosition = 1;
  //   nextNumberPosition = 1;
  // }

  // console.log(foundLastFileFromEntries);
  // console.log(foundLastFile);

  filteredFoundLastFile = foundLastFile.filter((ffilter) =>
    ffilter.includes(rekamConfig.suffix)
  );

  if (filteredFoundLastFile.length < 1) {
    lastNumberPosition = 1;
    nextNumberPosition = 1;

    // return lastNumberPosition;
  } else {
    let lastFileNum = filteredFoundLastFile.reverse()[0];

    let regexPattern = rekamConfig.suffix + "_(\\d+)(?=\\.\\w+$)";
    const regex = new RegExp(regexPattern);

    lastNumberPosition = parseInt(lastFileNum.match(regex)[1]);
    nextNumberPosition = lastNumberPosition + 1;

    // return lastNumberPosition;
  }
}

// fungsi fungsi export video
// ________________________________________________________________________
async function actExportVideo() {
  await fetchDocument();
  let currentActiveOutDirName = `${rekamConfig.suffix}_${thisDocument.name}`;

  let currentActiveOutDirEntry = await chosenFolderEntry
    .getEntry(currentActiveOutDirName)
    .then((succ) => succ);

  toBeExportedFramesAmount = fs.readdirSync(currentActiveOutDirEntry).length;

  // console.log(toBeExportedFramesAmount);

  if (toBeExportedFramesAmount > 0) {
    actCreateFfmpegCmd();
  } else {
    core.showAlert(
      "No data recorded on output folder...  Please run a recording session while document is in working."
    );
  }
}

// fungsi write export image/jpeg file lists
// ________________________________________________________________________
async function actWriteExportList() {
  let currentActiveOutDirName = `${rekamConfig.suffix}_${thisDocument.name}`;

  let currentActiveOutDirEntry = await chosenFolderEntry
    .getEntry(currentActiveOutDirName)
    .then((succ) => succ);

  let savedFileTextList = await rekamConfig.pluginScriptsDataDir
    .createFile("exportList.txt", { overwrite: true })
    .then((succ) => succ);

  let readDirFiles = fs.readdirSync(currentActiveOutDirEntry);

  lastFrameFromExportLists = `${currentActiveOutDirEntry.nativePath}/${
    readDirFiles[readDirFiles.length - 1]
  }`;

  let readDirFileList = readDirFiles
    .map((x) => `file '${currentActiveOutDirEntry.nativePath}/${x}'`)
    .join("\n");

  savedFileTextList.write(readDirFileList, {
    encoding: "utf-8",
  });
}

// fungsi create ffmpeg command
// ________________________________________________________________________
async function actCreateFfmpegCmd() {
  let timestamp = new Date();
  let currentActiveOutDirName = `${rekamConfig.suffix}_${thisDocument.name}`;

  let currentActiveOutDirEntry = await chosenFolderEntry
    .getEntry(currentActiveOutDirName)
    .then((succ) => succ);

  //
  let timeStart = `${String(timestamp.getDate()).padStart(2, "0")}-${String(
    timestamp.getMonth()
  ).padStart(2, "0")}-${timestamp.getFullYear()}_${String(
    timestamp.getHours()
  ).padStart(2, "0")}.${String(timestamp.getMinutes()).padStart(2, "0")}`;

  // default value
  let ffmpegBin;
  let ffmpegCommandFile;
  let pluginDir = rekamConfig.pluginDir.nativePath;
  let ffmpegTempDir = `${pluginDir}/ffmpeg/temp`;
  let ffmpegCommandLogs = "-v 24 -stats -y";
  let ffmpegEncoderSettings = "-c:v libx264 -pix_fmt yuv420p -crf 18 -qp 23";

  let tempAfilename = `temp_a_${timeStart}_timeleapse.mp4`;
  let tempBfilename = `temp_b_${timeStart}_timeleapse.mp4`;
  let tempA = `${rekamConfig.pluginScriptsDataDir.nativePath}/${tempAfilename}`;
  let tempB = `${rekamConfig.pluginScriptsDataDir.nativePath}/${tempBfilename}`;
  let finalMp4 = `${chosenFolderEntry.nativePath}/${thisDocument.name}_${rekamConfig.suffix}_${timeStart}_timeleapse.mp4`;

  //
  let imageListsFile = `${rekamConfig.pluginScriptsDataDir.nativePath}/exportList.txt`;

  // video settings
  let videoFPS = 30;
  let holdStartPreviewDuration = 2;
  let holdEndPreviewDuration = 2;
  let videoFramesAmount =
    toBeExportedFramesAmount +
    holdEndPreviewDuration * videoFPS +
    holdStartPreviewDuration * videoFPS;

  let estimatedFinalDuration = videoFramesAmount / videoFPS;

  //
  let videoDurationSelection =
    rekamButtons.videoDuration.selectedOptions[0].value;
  let videoDuration = ``;
  let selectedVideoWidth =
    rekamButtons.videoResolution.selectedOptions[0].value - 1;

  // video default ratio
  let videoRatio = thisDocument.h / thisDocument.w;
  let calculatedVideoHeight = selectedVideoWidth * videoRatio;

  let stretcheDuration;

  // export file lists
  await actWriteExportList();

  switch (videoDurationSelection) {
    case "default":
      videoDuration = ``;
      stretcheDuration = `exported as inital duration (full length).`;
      break;
    case "30":
      videoDuration = `setpts=${
        Math.round((29 / estimatedFinalDuration) * 100) / 100
      }*PTS`;

      stretcheDuration = `final duration adjusted to 30 seconds.`;
      break;
    case "60":
      videoDuration = `setpts=${
        Math.round((59 / estimatedFinalDuration) * 100) / 100
      }*PTS`;

      stretcheDuration = `final duration adjusted to 60 seconds.`;
      break;
    default:
  }

  // console.log(videoDuration);

  switch (deviceInfo.os) {
    case "win32":
    case "win10":
      // init windows path
      ffmpegBin = `"${pluginDir}ffmpeg/windows/bin/ffmpeg.exe"`;
      // ffmpegCommandFile = `${ffmpegTempDir}/exportVideo.bat`;
      ffmpegCommandFile = await rekamConfig.pluginScriptsDataDir
        .createFile("exportVideo.bat", { overwrite: true })
        .then((suc) => suc);

      // write windows bat script
      ffmpegCmd = `
      @ECHO OFF
      TITLE (1/4) Exporting preview...
      ${ffmpegBin} ${ffmpegCommandLogs} -loop 1 -r ${videoFPS} -i "${lastFrameFromExportLists}" -t "${holdStartPreviewDuration}" ${ffmpegEncoderSettings} -vf "scale=${selectedVideoWidth}:${calculatedVideoHeight}:force_original_aspect_ratio=decrease:out_color_matrix=bt709:flags=lanczos, pad=${selectedVideoWidth}+1:${calculatedVideoHeight}+1:-1:-1:color=white" "${tempA}"
      ECHO rendering preview done. (1/4)
      ECHO _______________________________________________________________________
      ECHO:
      TITLE (2/4) Exporting main timeleapse.
      ${ffmpegBin} ${ffmpegCommandLogs} -f concat -safe 0 -r ${videoFPS} -i "${imageListsFile}" ${ffmpegEncoderSettings} -vf "scale=${selectedVideoWidth}:${calculatedVideoHeight}:force_original_aspect_ratio=decrease:out_color_matrix=bt709:flags=lanczos, pad=${selectedVideoWidth}+1:${calculatedVideoHeight}+1:-1:-1:color=white, tpad=stop_duration=${holdEndPreviewDuration}:stop_mode=clone:start_duration=${holdStartPreviewDuration}:start_mode=clone, ${videoDuration}" "${tempB}"
      ECHO rendering main timeleapse done. (2/4)
      ECHO _______________________________________________________________________
      ECHO:
      TITLE (3/4) Merging preview+main.
      ${ffmpegBin} ${ffmpegCommandLogs} -i "${tempA}" -i "${tempB}" -filter_complex "[0:v]fps=${videoFPS}, scale=out_color_matrix=bt709:flags=lanczos[v0];[1:v]fps=${videoFPS}, scale=out_color_matrix=bt709:flags=lanczos[v1];[v0][v1]xfade=transition=${
        rekamConfig.transition
      }:duration=${holdStartPreviewDuration * 0.2}:offset=${
        holdStartPreviewDuration * 0.8
      }, fps=${videoFPS}" ${ffmpegEncoderSettings} "${finalMp4}"
      ECHO rendering merged preview+main done. (3/4)
      ECHO _______________________________________________________________________
      ECHO:
      ECHO all ffmpeg render tasks done.
      cd /D "${rekamConfig.pluginScriptsDataDir.nativePath}"
      del "${tempAfilename}"
      del "${tempBfilename}"
      ECHO temporary files deleted. (4/4)
      ECHO _______________________________________________________________________
      TITLE (4/4) Export done. ${timeStart}
      ECHO:
      ECHO:
      ECHO ${timeStart} export task done.
      ECHO initial video duration: ${estimatedFinalDuration} seconds.
      ECHO ${stretcheDuration}
      ECHO Timeleapse saved to ${finalMp4}
      ECHO press any key to close this window and open output folder! :)
      PAUSE >nul
      explorer ${chosenFolderEntry.nativePath}`;
      //
      // console.log(lastFrameFromExportLists);

      // execute command for windows
      ffmpegCommandFile.write(ffmpegCmd, {
        encoding: "utf-8",
      });

      uxpshell.openPath(
        ffmpegCommandFile.nativePath,
        `you will begin to render ${thisDocument.name} timeleapse`
      );
      break;
    case "darwin":
      // init macos path
      ffmpegBin = `ffmpeg`;
      ffmpegCommandFile = await rekamConfig.pluginScriptsDataDir
        .createFile("exportVideo.sh", { overwrite: true })
        .then((suc) => suc);

      // write ffmpeg bash scripts for mac
      /*
      ffmpegCmd = `
      ## (1/4) Exporting preview...
      ${ffmpegBin} ${ffmpegCommandLogs} -loop 1 -r ${videoFPS} -i "${lastFrameFromExportLists}" -t "${holdStartPreviewDuration}"  -c:v libx264 -crf 18 -vf "scale=${selectedVideoWidth}:${calculatedVideoHeight}:force_original_aspect_ratio=decrease, format=yuv420p, pad=${selectedVideoWidth}+1:${calculatedVideoHeight}+1:-1:-1:color=white" -pix_fmt yuv420p "${tempA}"
      ECHO "rendering preview done. (1/4)"
      ECHO "_______________________________________________________________________"
      ECHO "\n"
      ##TITLE (2/4) Exporting main timeleapse.
      ${ffmpegBin} ${ffmpegCommandLogs} -f concat -safe 0 -r ${videoFPS} -i "${imageListsFile}" -c:v libx264 -crf 18 -vf "scale=${selectedVideoWidth}:${calculatedVideoHeight}:force_original_aspect_ratio=decrease, format=yuv420p, pad=${selectedVideoWidth}+1:${calculatedVideoHeight}+1:-1:-1:color=white, tpad=stop_duration=${holdEndPreviewDuration}:stop_mode=clone:start_duration=${holdStartPreviewDuration}:start_mode=clone, ${videoDuration}" -pix_fmt yuv420p "${tempB}"
      ECHO "rendering main timeleapse done. (2/4)"
      ECHO "_______________________________________________________________________"
      ECHO "\n" 
      ##TITLE (3/4) Merging preview+main.
      ${ffmpegBin} ${ffmpegCommandLogs} -i "${tempA}" -i "${tempB}" -filter_complex "[0:v]fps=${videoFPS}[v0];[1:v]fps=${videoFPS}[v1];[v0][v1]xfade=transition=fade:duration=1:offset=1, format=yuv420p, fps=${videoFPS}" -c:v libx264 -crf 18 -pix_fmt yuv420p "${finalMp4}"
      ECHO "rendering merged preview+main done. (3/4)"
      ECHO "_______________________________________________________________________"
      ECHO "\n" 
      ECHO "all ffmpeg render tasks done."
      cd "${rekamConfig.pluginScriptsDataDir.nativePath}"
      rm "${tempAfilename}"
      rm "${tempBfilename}"
      ECHO "temporary files deleted. (4/4)"
      ECHO "_______________________________________________________________________"
      ##TITLE (4/4) Export done. ${timeStart}
      ECHO "\n\n" 
      ECHO "${timeStart} export task done."
      ECHO "initial video duration: ${estimatedFinalDuration} seconds."
      ECHO "${stretcheDuration}"
      ECHO "Timeleapse saved to ${finalMp4}"
      read -p "press any key to close this window and open output folder! :)"
      cd "${chosenFolderEntry.nativePath}"
      open .`;

      // execute command for mac
      
      ffmpegCommandFile.write(ffmpegCmd, {
        encoding: "utf-8",
      });

      uxpshell.openPath(
        ffmpegCommandFile.nativePath,
        `you will begin to render ${thisDocument.name} timeleapse`
      );
      */

      core.showAlert(
        "currently export video function is not availabke on mac."
      );
      break;
    default:
  }
}

// uxp dom layout setup
// ________________________________________________________________________
function actOpenPluginDataDir() {
  uxpshell.openPath(rekamConfig.pluginDataDir.nativePath);
}

// uxp dom layout setup
// ________________________________________________________________________
// reload plugins & metas plugins click trigger
rekamInfos.reloadPlugins.addEventListener("click", actReloadPlugins);
rekamInfos.rekamMetas.addEventListener("click", openDevHomepage);

// select and open folder click trigger
rekamButtons.selectFolder.addEventListener("click", actSelectFolder);
rekamButtons.openFolder.addEventListener("click", actOpenOutputFolder);

// event recording click trigger
rekamButtons.start.addEventListener("click", () => {
  startRecording();
});
rekamButtons.stop.addEventListener("click", () => {
  stopRecording("recording session isn't running..");
});

// export video click trigger
rekamButtons.exportVideo.addEventListener("click", actExportVideo);

// photoshop API Listener
// ________________________________________________________________________
// ps.action.addNotificationListener(["layersFiltered"], documentSwitchListener);

// new document, open document, change document listeber
ps.action.addNotificationListener(
  [{ event: "make" }, { event: "open" }, { event: "layersFiltered" }],
  documentSwitchListener
);

// homescreen visibility listener
ps.action.addNotificationListener(
  [{ event: "homeScreenVisibilityChanged" }],
  (event, descriptor) => {
    // console.log(event + "> " + descriptor.visible);
    if (descriptor.visible) {
      location.reload();
    } else {
      rekamInfos.currentActiveDoc.innerText = `(active document: none)`;
    }
  }
);

// document resize listener
ps.action.addNotificationListener(
  [
    { event: "imageSize" },
    { event: "crop" },
    { event: "rotateEventEnum" },
    { event: "canvasSize" },
  ],
  recordedDocResizedListener
);

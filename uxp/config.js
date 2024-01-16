/*



Rekam ~ Timelapse plugins for Photoshop
written by eto satrio ( @armsaroundmyknees )
armsaroundmyknees.github.io/rekam
january 2024



*/
// user configured variables
// ________________________________________________________________________
let rekamConfig = {
  suffix: "rekam", // files & folder named suffix, e.g. mycooldrawings_rekam
  jpegQuality: 5, // 1-12 greater is better quality but slower'
  zeroPad: 10, // sequence filenamed suffix, e.g. mycooldrawing_rekam_0000000001.jpg
  ext: ".jpg", //
  interval: 1, //
  transition: "fadeslow", // ffmpeg xfade transition https://ffmpeg.org/ffmpeg-filters.html#xfade
};

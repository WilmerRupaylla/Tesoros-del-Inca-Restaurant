import path from "path";
import fs from "fs";
import { glob } from "glob";
import { src, dest, watch, series } from "gulp";
import * as dartSass from "sass";
import gulpSass from "gulp-sass";
import htmlmin from "gulp-htmlmin";
const sass = gulpSass(dartSass);
import concat from "gulp-concat";

import terser from "gulp-terser";
import sharp from "sharp";

function js(done) {
  src("src/js/**/*.js")
    .pipe(concat("bundle.js"))
    .pipe(terser())
    .pipe(dest("build/js"));

  done();
}

export function css(done) {
  src("src/scss/app.scss", { sourcemaps: true })
    .pipe(
      sass({
        // style: "compressed",
        outputStyle: "expanded",
      }).on("error", sass.logError)
    )
    .pipe(dest("build/css", { sourcemaps: "." }));

  done();
}

export async function imagenes(done) {
  const srcDir = "./src/img";
  const buildDir = "./build/img/full";
  const images = await glob("./src/img/**/*.**");

  images.forEach((file) => {
    const relativePath = path.relative(srcDir, path.dirname(file));
    const outputSubDir = path.join(buildDir, relativePath);
    procesarImagenes(file, outputSubDir);
  });
  done();
}
export async function imagenes_thumb(done) {
  const srcDir = "./src/img";
  const buildDir = "./build/img/thumb";
  const images = await glob("./src/img/**/*.**");

  images.forEach((file) => {
    const relativePath = path.relative(srcDir, path.dirname(file));
    const outputSubDir = path.join(buildDir, relativePath);
    procesarImagenes_thumb(file, outputSubDir);
  });
  done();
}

function procesarImagenes(file, outputSubDir) {
  if (!fs.existsSync(outputSubDir)) {
    fs.mkdirSync(outputSubDir, { recursive: true });
  }
  const baseName = path.basename(file, path.extname(file));
  const outputFileWebp = path.join(outputSubDir, `${baseName}.webp`);
  const outputFileAvif = path.join(outputSubDir, `${baseName}.avif`);

  sharp(file).webp().toFile(outputFileWebp);
  sharp(file).avif().toFile(outputFileAvif);
}
// Variantes tipo SCSS maps ✨
const variantes = [
  { name: "thumb", width: 300, height: 200 },
  { name: "normal", width: 530, height: 350 },
  { name: "retina", width: 1200, height: 800 },
];

const posiciones = [
  "center",
  "top",
  "bottom",
  "left",
  "right",
  "entropy",
  "attention",
];

// Tercera version mejorada de procesarImagenes_thumb

function procesarImagenes_thumb(file, outputBaseDir, posicion = "entropy") {
  const ext = path.extname(file);
  const baseName = path.basename(file, ext);

  variantes.forEach((variant) => {
    const outputSubDir = path.join(outputBaseDir, variant.name);
    if (!fs.existsSync(outputSubDir)) {
      fs.mkdirSync(outputSubDir, { recursive: true });
    }

    const webpPath = path.join(outputSubDir, `${baseName}.webp`);
    const avifPath = path.join(outputSubDir, `${baseName}.avif`);

    const img = sharp(file).resize(variant.width, variant.height, {
      fit: "cover",
      position: posiciones.includes(posicion) ? posicion : "bottom",
    });

    Promise.all([
      img.clone().webp({ quality: 80 }).toFile(webpPath),
      img.clone().avif({ quality: 60 }).toFile(avifPath),
    ])
      .then(() => {
        console.log(
          `✔️ ${variant.name} (${posicion}) procesada para ${baseName}`
        );
      })
      .catch((err) => {
        console.error(`❌ Error en ${variant.name}:`, err);
      });
  });
}
// fin tercera version

// Primera Version
// function procesarImagenes_thumb(file, outputSubDir) {
//   if (!fs.existsSync(outputSubDir)) {
//     fs.mkdirSync(outputSubDir, { recursive: true });
//   }
//   const baseName = path.basename(file, path.extname(file));
//   const outputFileWebp = path.join(outputSubDir, `${baseName}.webp`);
//   const outputFileAvif = path.join(outputSubDir, `${baseName}.avif`);

//   const width = 800; // Cambia este valor si quieres otro ancho

//   sharp(file).resize(width).webp().toFile(outputFileWebp);
//   sharp(file).resize(width).avif().toFile(outputFileAvif);
// }
// Fin primera Version

function collapse() {
  return src("page/**/*.html")
    .pipe(
      htmlmin({ collapseWhitespace: true, minifyCSS: true, minifyJS: true })
    )
    .pipe(dest("build"));
}

export function dev() {
  watch("src/scss/**/*.scss", css);
  watch("src/js/**/*.js", js);
  watch("src/img/**/*.**", imagenes);
  watch("src/img/**/*.**", imagenes_thumb);
  watch("page/**/*.html", collapse);
}

export default series(js, css, collapse, imagenes, imagenes_thumb, dev);

// position	Descripción
// 'center'	Centra la imagen (por defecto)
// 'top'	Recorta desde la parte superior
// 'bottom'	Recorta desde la parte inferior
// 'left'	Recorta desde el borde izquierdo
// 'right'	Recorta desde el borde derecho
// 'top-left'	Esquina superior izquierda
// 'top-right'	Esquina superior derecha
// 'bottom-left'	Esquina inferior izquierda
// 'bottom-right'	Esquina inferior derecha
// 'entropy'	Analiza dónde hay más “información visual” y recorta allí
// 'attention'	Usa detección de rostros/zonas de interés para el recorte

// segunda version mejorada
// function procesarImagenes_thumb(file, outputBaseDir) {
//   const ext = path.extname(file);
//   const baseName = path.basename(file, ext);

//   variantes.forEach(variant => {
//     const outputSubDir = path.join(outputBaseDir, variant.name);
//     if (!fs.existsSync(outputSubDir)) {
//       fs.mkdirSync(outputSubDir, { recursive: true });
//     }

//     const webpPath = path.join(outputSubDir, `${baseName}.webp`);
//     const avifPath = path.join(outputSubDir, `${baseName}.avif`);

//     const img = sharp(file).resize(variant.width, variant.height, {
//       fit: 'cover',
//       position: 'center'
//     });

//     Promise.all([
//       img.clone().webp({ quality: 80 }).toFile(webpPath),
//       img.clone().avif({ quality: 60 }).toFile(avifPath)
//     ])
//     .then(() => {
//       console.log(`✔️ ${variant.name} procesada para ${baseName}`);
//     })
//     .catch(err => {
//       console.error(`❌ Error en ${variant.name}:`, err);
//     });
//   });
// }

// fin de prueba

// export async function crop(done) {
//     const inputFolder = 'src/img/gallery/full'
//     const outputFolder = 'src/img/gallery/thumb';
//     const width = 250;

//     if (!fs.existsSync(outputFolder)) {
//         fs.mkdirSync(outputFolder, { recursive: true })
//     }
//     const images = fs.readdirSync(inputFolder).filter(file => {
//         return /\.(jpg|png)$/i.test(path.extname(file));
//     });
//     try {
//         images.forEach(file => {
//             const inputFile = path.join(inputFolder, file)
//             const outputFile = path.join(outputFolder, file)
//             sharp(inputFile)
//                 .resize(width, undefined, {
//                      fit: 'contain',
//                     position: 'center'
//                 })
//                 .toFile(outputFile)
//         });

//         done()
//     } catch (error) {
//         console.log(error)
//     }
// }

// export async function croppng(done) {
//     const inputFolder = 'src/img/gallery/full'
//     const outputFolder = 'src/img/gallery/thumb';
//     const width = 300;
//     const height = 250;
//     if (!fs.existsSync(outputFolder)) {
//         fs.mkdirSync(outputFolder, { recursive: true })
//     }
//     const images = fs.readdirSync(inputFolder).filter(file => {
//         return /\.(png)$/i.test(path.extname(file));
//     });
//     try {
//         images.forEach(file => {
//             const inputFile = path.join(inputFolder, file)
//             const outputFile = path.join(outputFolder, file)
//             sharp(inputFile)
//                 .resize(width, height, {
//                     position: 'centre'
//                 })
//                 .toFile(outputFile)
//         });

//         done()
//     } catch (error) {
//         console.log(error)
//     }
// }

// export async function cropavif(done) {
//     const inputFolder = 'src/img/gallery/full'
//     const outputFolder = 'src/img/gallery/thumb';
//     const width = 250;
//     const height = 180;
//     if (!fs.existsSync(outputFolder)) {
//         fs.mkdirSync(outputFolder, { recursive: true })
//     }
//     const images = fs.readdirSync(inputFolder).filter(file => {
//         return /\.(avif)$/i.test(path.extname(file));
//     });
//     try {
//         images.forEach(file => {
//             const inputFile = path.join(inputFolder, file)
//             const outputFile = path.join(outputFolder, file)
//             sharp(inputFile)
//                 .resize(width, height, {
//                     position: 'centre'
//                 })
//                 .toFile(outputFile)
//         });

//         done()
//     } catch (error) {
//         console.log(error)
//     }
// }

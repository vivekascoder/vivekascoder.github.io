+++
title = "🌆 Collage"
date = 2023-05-22
path = "collage"
+++


<!-- <div>
    <img src="/img/collage/girlinred_1.jpg" />
    <img src="/img/collage/girlinred_2.jpeg" />
<div> -->

<style>
* {
  box-sizing: border-box;
}

body {
  margin: 0;
}

.header {
  text-align: center;
  padding: 32px;
}

.row {
  display: -ms-flexbox; /* IE10 */
  display: flex;
  -ms-flex-wrap: wrap; /* IE10 */
  flex-wrap: wrap;
  padding: 0 4px;
}

/* Create four equal columns that sits next to each other */
.column {
  /* -ms-flex: 25%; IE10 */
  flex: 33.33%;
  max-width: 33.33%;
  padding: 0 4px;
}

.column img {
  margin-top: 8px;
  vertical-align: middle;
  width: 100%;
}

/* Responsive layout - makes a two column-layout instead of four columns */
@media screen and (max-width: 800px) {
  .column {
    -ms-flex: 50%;
    flex: 50%;
    max-width: 50%;
  }
}

/* Responsive layout - makes the two columns stack on top of each other instead of next to each other */
@media screen and (max-width: 600px) {
  .column {
    -ms-flex: 100%;
    flex: 100%;
    max-width: 100%;
  }
}

img {
    border: none;
}
</style>
<body>

<div class="row"> 
  <div class="column">
    <img src="/img/collage/girlinred_1.jpg" style="width:100%">
    <img src="/img/collage/girlinred_2.jpeg" style="width:100%">
    <img src="/img/collage/freddie_1.jpg" style="width:100%">
    <img src="/img/collage/seven_nation_army.jpg" style="width:100%">
    <img src="/img/collage/kiss_1.jpg" style="width:100%">
  </div>
  <div class="column">
    <img src="/img/collage/boywithuke.webp" style="width:100%">
    <img src="/img/collage/sxmpra_1.jpg" style="width:100%">
    <img src="/img/collage/georgehotz_1.jpeg" style="width:100%">
    <img src="/img/collage/freddie_mercury_1.jpg" style="width:100%">
    <img src="/img/collage/daft_punk_1.jpg" style="width:100%">
  </div>
  <div class="column">
    <img src="/img/collage/olivertree_1.webp" style="width:100%">
    <img src="/img/collage/sxmpra_2.jpg" style="width:100%">
    <img src="/img/collage/sadboyprolific_1.jpg" style="width:100%">
    <img src="/img/collage/acdc_1.jpg" style="width:100%">
    <img src="/img/collage/cage_the_elephant.webp" style="width:100%">
  </div>
</div>
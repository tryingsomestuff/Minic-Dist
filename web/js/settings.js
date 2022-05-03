let engine_side_select      = document.getElementById("select-engine-side");
let engine_think_slider     = document.getElementById("slider-engine-think-time");
let engine_multipv_slider   = document.getElementById("slider-engine-multipv");
let engine_hash_slider      = document.getElementById("slider-engine-hash");
let engine_threads_slider   = document.getElementById("slider-engine-threads");
let engine_level_slider     = document.getElementById("slider-engine-level");

// switch between tabs
let settings_open = false;
document.getElementById("btn-settings").onclick = function(){
    if(settings_open){
        document.getElementById("side-tab1").classList.remove("d-none");
        document.getElementById("side-tab2").classList.add("d-none");
        document.getElementById("btn-settings").style.color = "black";
    }else{
        document.getElementById("side-tab2").classList.remove("d-none");
        document.getElementById("side-tab1").classList.add("d-none");
        document.getElementById("btn-settings").style.color = "#0d6efd";
    }
    settings_open = !settings_open;
}


// set the max threads to hardware concurrency
engine_threads_slider.max = navigator.hardwareConcurrency;

// listener for the selection when the engine should play
engine_side_select.onchange = function (){
    engine_think_slider.disabled = engine_side_select.value === "None";
    engine_multipv_slider.disabled = ["White", "Black"].includes(engine_side_select.value);
    setSide(engine_side_select.value);
}

// slider listener
function create_slider_listener(name,log=false,func=function(){}){
    var slider = $(`#slider-${name}`);
    slider.on("input change", function() {
        $(`#label-${name}`).text(log ? Math.pow(2, slider.val()) : slider.val())
        func();
    });
}

create_slider_listener("engine-think-time"     , false, function (){setThinkTime(engine_think_slider.value)});
create_slider_listener("engine-multipv"        , false, function (){setMultiPV(engine_multipv_slider.value)});
create_slider_listener("engine-hash"           , true , function (){setHash(Math.pow(2,engine_hash_slider.value))});
create_slider_listener("engine-threads"        , false, function (){setThreads(engine_threads_slider.value)});
create_slider_listener("engine-level"          , false, function (){setLevel(engine_level_slider.value)});
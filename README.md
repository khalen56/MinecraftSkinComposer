# MinecraftSkinComposer

[Demo](http://esperia-rp.net/skindemo/)

A simple browser application that allows you to compose a minecraft skin using parts of skins.

All you need are images to composer the skin and a JSON file / JSON endpoint returning the list of available parts with this format :

    {
        "accessories": [
            "mustache.png"
        ],
        "boots": [
            "2.png",
            "1.png"
        ],
        "face": [
            "face1.png"
        ],
        "dress": [
            "Magistra Marron.png",
            "Robe man 1.png",
            "Robe A.png",
            "Magistra Rouge.png",
            "Robe Femme A.png"
        ],
        "coat": [
            "Magistra Marron.png",
            "Manteau noble A.png",
            "Manteau Nivose Custom 1.png",
            "Magistra Rouge.png",
            "Manteau cuir A.png",
            "manteau A.png",
            "Manteau B.png",
            "Manteau cuir.png",
            "Manteau C.png"
        ],
        "pant": [
            "Pantalon A.png"
        ],
        "body_base": {
            "0": "male.png",
            "1": "female.png",
            "subfolder": [
                "1.png"
            ]
        },
        "hat": [
            "Chapeau A.png",
            "Chapeau C.png",
            "Chapeau B.png",
            "Chapeau E.png",
            "Chapeau D.png"
        ],
        "cape": [
            "Cape A.png"
        ],
        "hair": [
            "hair2.png",
            "hair.png"
        ]
    }

A sample PHP file providing this is included.

Skin rendering is made with [skinview3D](https://github.com/bs-community/skinview3d).

## Features

- Should support all skins formats (1.8 and older)
- HD skins

## Usage

    const composer = new SkinComposer(document.getElementById("skinComposer"));
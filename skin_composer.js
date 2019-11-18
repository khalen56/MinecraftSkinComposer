;function SkinComposer(elem) {
    this.container = elem;
    this.skinViewer = null;
    this.skinContainer = null;
    this.layout = {};
    this.parts = [];
    this.canvas = null;

    this.init();
}

SkinComposer.prototype.initSkinViewer = function() {
    this.skinViewer = new skinview3d.SkinViewer({
        domElement: this.skinContainer,
        slim: false,
        width: 400,
        height: 600
    });
    let control = new skinview3d.createOrbitControls(this.skinViewer);
    this.skinViewer.animation = new skinview3d.CompositeAnimation();
    let walk = this.skinViewer.animation.add(skinview3d.WalkingAnimation);
};

SkinComposer.prototype.initLayout = function() {

    // Appending parts container
    const leftColumn = $('<div>', {"class": "left-column"})[0];
    this.layout.leftColumn = leftColumn;
    this.initPartsStore();
    $(this.container).append(leftColumn);

    // Appending skin viewer
    const skinContainer = $('<div>', {'class': 'central-column'})[0];
    this.skinContainer = skinContainer;
    $(this.container).append(skinContainer);

    // Creating layers container
    const rightColumn = $('<div>', {"class": "right-column"})[0];
    const layersContainer = $('<div>', {"class": "layers-container"})[0];
    this.layout.rightColumn = rightColumn;
    this.layout.rightColumn.layersContainer = layersContainer;
    $(rightColumn).append(layersContainer);
    $(this.container).append(rightColumn);
    this.refreshLayers();
};

SkinComposer.prototype.initPartsStore = function() {
    const that = this;
    $.get('files.php')
    .done(data => {
        const list = that.createPartList(data, 'resources');
        this.layout.leftColumn.append(list);
    });
};

SkinComposer.prototype.createPartList = function(parts, base) {
    const that = this;

    const list = $('<ul>')[0];
    Object.keys(parts).forEach(dir => {
        const files = parts[dir];

        if (typeof files === "string") {
            const uri = base + '/' + files;
            $(list).append(that.createPartListElem(uri, files));
        } else {
            const parent = $('<li>')[0];
            const label = $('<span>', {"text": dir, "class": "directory-label"})[0];
            $(parent).append(label);
            if (Array.isArray(files)) {
                const filesList = $('<ul>')[0];
                files.forEach(file => {
                    const uri = base + '/' + dir + '/' + file;
                    $(filesList).append(that.createPartListElem(uri, file));
                });
                $(parent).append(filesList);

                $(label).on('click', (e) => {
                    $(filesList).toggle();
                });
            } else if (typeof files === "object") {
                const sublist = that.createPartList(files, base + '/' + dir);
                $(parent).append(sublist);
                $(label).on('click', (e) => {
                    $(sublist).toggle();
                });
            }
            $(list).append(parent);
        }
    });
    return list;
};

SkinComposer.prototype.createPartListElem = function (uri, name) {
    const that = this;
    const item = $('<li>', {'class': 'file'})[0];
    $(item).data('uri', uri)
    const img = new Image();
    const label = $('<span>');
    label.text(name);
    img.src = uri;
    $(item).append(img);
    $(item).append(label);

    const add = $('<a>', {'class': 'add-part', 'href': '#', 'text': '+'})[0];
    $(add).click(function(e) {
        e.preventDefault();
        e.stopPropagation();
        that.addPart(uri, name);
    });
    $(item).append(add);

    return item;
}

SkinComposer.prototype.refreshLayers = function() {
    const that = this;
    $(that.layout.rightColumn.layersContainer).html("");
    const layersList = $('<ul>')[0];
    new Sortable(layersList, {
        onUpdate: function() {
            that.refreshPartsOrder();
        }
    });

    const sorted = JSON.parse(JSON.stringify(this.parts)).reverse();

    sorted.forEach(part => {
        const partWrapper = $('<li>', {"class": "part-wrapper"})[0];
        $(partWrapper).data('uri', part.uri);
        $(partWrapper).data('name', part.name);

        // Image
        const img = new Image();
        img.src = part.uri;
        img.width = 96;
        $(partWrapper).append(img);

        const infoWrapper = $('<div>', {"class": "part-infos"})[0];

        // Label
        const label = $('<span>', {"class": "choosed-part-label", "text": part.name})[0];
        $(infoWrapper).append(label);

        // Color picker
        const color = $('<div>')[0];
        $(infoWrapper).append(color);

        const pickr = Pickr.create({
            el: color,
            theme: 'monolith', // or 'monolith', or 'nano',
            default: part.color || null,
            defaultRepresentation: 'HEX',

            components: {

                // Main components
                preview: true,
                opacity: false,
                hue: true,

                // Input / output Options
                interaction: {
                    hex: true,
                    rgba: false,
                    hsla: false,
                    hsva: false,
                    cmyk: false,
                    input: true,
                    clear: true,
                    save: true
                }
            }
        });

        pickr.on('save', function(color) {
            if (color) $(partWrapper).data('color', color.toHEXA().toString());
            else $(partWrapper).removeData('color');
            that.refreshPartsOrder();
        });

        pickr.on('clear', function() {
            $(partWrapper).removeData('color');
            that.refreshPartsOrder();
        });

        partWrapper.pickr = pickr;

        if (part.color) {
            pickr.setColor(part.color);
            $(partWrapper).data('color', part.color);
        };

        // Delete button
        const deleteLink = $('<a>', {"class": "delete-part", "text": "Delete", "href": "#"})[0];
        $(deleteLink).on("click", function(e) {
            e.preventDefault();
            that.deletePart(partWrapper);
        });
        $(infoWrapper).append(deleteLink);

        // Appending
        $(layersList).append(partWrapper);
        $(partWrapper).append(infoWrapper);
    });

    $(that.layout.rightColumn.layersContainer).append(layersList);
    this.drawCanvas();
};

SkinComposer.prototype.deletePart = function(partWrapper) {
    const that = this;
    this.parts.forEach((part, index) => {
        if (part.uri === $(partWrapper).data('uri')) {
            this.parts.slice(index, 1);
            partWrapper.pickr.destroyAndRemove();
            $(partWrapper).remove();
            that.refreshPartsOrder();
            that.refreshLayers();
        }
    });
};

SkinComposer.prototype.addPart = function(uri, name) {
    if (!this.hasPart(uri)) {
        this.parts.push({uri: uri, name: name});
        this.refreshLayers();
    }
}

SkinComposer.prototype.hasPart = function(uri) {
    let flag = false;
    this.parts.forEach((part, index) => {
        if (part.uri === uri) {
            flag = true;
        }
    });
    return flag;
};

SkinComposer.prototype.refreshPartsOrder = function() {
    const parts = [];
    $(this.layout.rightColumn.layersContainer).find("li").each(function() {

        const part = {
            uri: $(this).data('uri'),
            name: $(this).data('name')
        };

        if ($(this).data('color')) {
            part.color = $(this).data('color');
        }

        parts.push(part);
    });
    this.parts = parts.reverse();
    this.drawCanvas();
};

SkinComposer.prototype.init = function() {
    const that = this;

    this.canvas = document.createElement("CANVAS");
    this.canvasContext = this.canvas.getContext("2d");
    this.initLayout();
    this.initSkinViewer();

    const download = $('<a>', {'href': '#', 'class': 'btn', text: 'Télécharger'});
    console.log(download);
    download.click(function(e) {
        e.preventDefault();
        that.downloadImage();
    });
    $(this.skinContainer).append(download);
};

SkinComposer.prototype.computeCanvasSize = function() {
    return new Promise((resolve) => {
        const dim = {w: 0, h: 0};

        async.eachLimit(this.parts, 1, (part, next) => {
            const img = new Image();
            img.src = part.uri;

            img.onload = () => {
                if (img.width > dim.w) dim.w = img.width;
                if (img.height > dim.h) dim.h = img.height;
                next();
            };
        }, () => {
            resolve(dim);
        });
    });
};

SkinComposer.prototype.drawCanvas = async function() {
    const that = this;

    if (!this.parts.length) return;

    const d = await this.computeCanvasSize();
    this.canvas.width = d.w;
    this.canvas.height = d.h;

    async.eachLimit(this.parts, 1, (part, next) => {
        const img = new Image();
        img.src = part.uri;

        img.onload = () => {

            if (part.color) {
                const tCanvas = document.createElement("CANVAS");
                tCanvas.width = d.w;
                tCanvas.height = d.h;
                const context = tCanvas.getContext("2d");

                context.drawImage(img, 0, 0, d.w, d.h);

                const data = context.getImageData(0,0, d.w, d.h);

                for(var i=0; i<data.data.length; i+=4) {
                    const r = data.data[i];
                    const g = data.data[i+1];
                    const b = data.data[i+2];
                    const a = data.data[i+3];

                    if (r || g || b || a) {
                        const color = jQuery.Color(r, g, b, a);
                        const color2 = jQuery.Color(part.color);
                        const mix = Color_mixer.mix(color, color2);
                        data.data[i] = mix._rgba[0];
                        data.data[i+1] = mix._rgba[1];
                        data.data[i+2] = mix._rgba[2];
                        data.data[i+3] = mix._rgba[3] * 255;
                    }
                }

                context.putImageData(data, 0, 0);

                const tImg = new Image();
                tImg.src = tCanvas.toDataURL("image/png");

                tImg.onload = () => {
                    that.canvas.getContext("2d").drawImage(tImg, 0, 0, d.w, d.h);
                    next();
                    //$(tCanvas).remove();
                };
            } else {
                const img = new Image();
                img.src = part.uri;

                img.onload = () => {
                    that.canvasContext.drawImage(img, 0, 0, d.w, d.h);
                    next();
                };
            }
        };
    }, () => {
        that.skinViewer.skinUrl = that.canvas.toDataURL("image/png");
    });
};

SkinComposer.prototype.downloadImage = function() {
    const link = $('<a>');
    link.attr('href', this.canvas.toDataURL("image/png"));
    link.attr('download', 'skin.png');
    $('body').append(link);
    link[0].click();
    link.remove();
};
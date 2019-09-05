global.all = (...items) => {
    for (let item of items)
        if (!item)
            return false;
    return true;
};

global.any = (...items) => {
    for (let item of items)
        if (item)
            return true;
    return false;
};
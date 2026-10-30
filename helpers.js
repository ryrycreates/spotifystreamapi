export const getRandomTimeout = () => {
    const timeout = parseInt(Math.random() * 1000) + 1;
    return timeout < 200 ? 200 : timeout;
}

export const toURI = (type, id) => {
    return `spotify:${type}:${id}`;
}

export const extractId = (uri) => {
    return uri.split(":").pop();
}

export const getDate = () => {
    const formatter = new Intl.DateTimeFormat('en-CA', {
        timeZone: 'America/Chicago',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
    });

    return formatter.format(new Date());
}
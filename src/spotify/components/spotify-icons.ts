function getIconUrl(source: string) {
    return new URL(`./icons/${source}`, import.meta.url).toString();
}

const SpotifyIcons = {
    PrimaryLogoGreen: getIconUrl('Primary_Logo_Green_RGB.svg'),
    FullLogoGreen: getIconUrl('Full_Logo_Green_RGB.svg'),
};

export default SpotifyIcons;
declare module "filepond-plugin-image-edit" {
    const FilePondPluginImageEdit: FilePondPluginImageEditProps;
    export interface FilePondPluginImageEditProps {
        /** Enable or disable image editing */
        allowImageEdit?: boolean;

        /** Position of the image edit button within the image preview window */
        styleImageEditButtonEditItemPosition?: string;

        /** Instantly opens the editor when an image is added, when editing is cancelled the image is not added to FilePond */
        imageEditInstantEdit?: boolean;

        /** Disables the manual edit button. */
        imageEditAllowEdit?: boolean;

        /** The SVG icon used in the image edit button */
        imageEditIconEdit?: string;

        /** The Image Editor to link to FilePond */
        imageEditEditor?: any;
    }
    export default FilePondPluginImageEdit;
}
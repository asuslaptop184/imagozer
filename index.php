<?php
/**
 * Plugin Name: ProVision Image Editor for WordPress / WooCommerce with Folders File Manager
 * Description: ProVision gives you a pro image editor inside of your WordPress dashboard. You can edit images on the fly and create better experiences for your customers.
 * Version: 1.0.0
 * Author: AA-Team
 * Author URI: http://www.aa-team.com
 * Text Domain: aa-provision-image-editor
 * Domain Path: /languages
 *
 * @package aa-provision-image-editor
 */

// Exit if accessed directly.
if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

if (class_exists('AA_ImageEditor') != true) {
	class AA_ImageEditor
	{
		private $upload_dir = null;

		protected static $instance = null;

		public static function getInstance()
		{
			if (!isset(static::$instance)) {
				static::$instance = new static;
			}
			return static::$instance;
		}

		protected function __construct()
		{
			$this->upload_dir = wp_upload_dir();

			add_action( 'admin_menu', array( $this, 'menu_page' ) );

			add_action( 'wp_ajax_NIMAjaxRequest', array( $this, 'ajax_request' ) );

			$this->backup_folder_path = $this->upload_dir['basedir'] . '/nice-image-backups';
			$this->backup_folder_url = $this->upload_dir['baseurl'] . '/nice-image-backups';

			register_activation_hook( __FILE__, array( $this, 'install_plugin' ) );
		}

		public function install_plugin()
		{
			global $table_prefix, $wpdb;

			$tables = array();

			$tables[ $table_prefix . "nice_image_folders" ] = "CREATE TABLE `" . ( $table_prefix . "nice_image_folders" ) . "` (
				`ID` INT(10) NOT NULL AUTO_INCREMENT,
					`folder_name` VARCHAR(100) NULL DEFAULT NULL,
					`parent_ID` INT(10) NULL DEFAULT '0',
					`count` INT(11) NULL DEFAULT '0',
					PRIMARY KEY (`ID`)
				)
				COLLATE='utf8_general_ci'
				ENGINE=InnoDB
				AUTO_INCREMENT=1
			;";

			$tables[ $table_prefix . "nice_image_folders2posts" ] = "CREATE TABLE `" . ( $table_prefix . "nice_image_folders2posts" ) . "` (
				`ID` INT(10) NOT NULL AUTO_INCREMENT,
				`post_ID` INT(10) NOT NULL DEFAULT '0',
				`folder_ID` INT(10) NOT NULL DEFAULT '0',
				PRIMARY KEY (`ID`),
				UNIQUE INDEX `post_ID` (`post_ID`)
			)
			COLLATE='utf8_general_ci'
			ENGINE=InnoDB
			AUTO_INCREMENT=1
			;";

			foreach ($tables as $table_name => $sql) {
				if( $wpdb->get_var( "show tables like $table_name" ) != $table_name ) {

					require_once( ABSPATH . '/wp-admin/includes/upgrade.php' );
					dbDelta( $sql );
				}
			}
		}

		public function menu_page()
		{
			add_menu_page(
				esc_html__( 'Pro Image Editor', 'aa-provision-image-editor' ),
				esc_html__('Pro Editor', 'aa-provision-image-editor'),
				'manage_options',
				'image_editor',
				array( $this, 'page_html' ),
				plugins_url( 'icon.png', __FILE__ )
			);

			wp_enqueue_script(
				'image/editor',
				plugins_url( 'build/backend/backend.build.js', __FILE__ ),
				array( 'wp-blocks', 'wp-element', 'wp-editor', 'wp-dom-ready' ),
				'1.0',
				true
			);

			wp_enqueue_script(
				'image/admin',
				plugins_url( 'assets/admin.js', __FILE__ )
			);

			wp_enqueue_script(
				'image/face-detector',
				plugins_url( 'assets/face-detector.min.js', __FILE__ )
			);

			wp_localize_script( 'image/admin', 'NIM', array(
				'edit_url' => admin_url('admin.php?page=image_editor&image_id='),
				'cascadeurl' => plugins_url( 'assets/facefinder.data', __FILE__ ),
				'texturesurl' => plugins_url( 'assets/textures', __FILE__ ),
				'ajax_url' => admin_url('admin-ajax.php?action=NIMAjaxRequest'),
				'add_new_url' => admin_url('media-new.php'),
				'plugin_url' => admin_url('admin.php?page=image_editor'),
				'folders' => $this->get_folders()
			) );

			wp_enqueue_style(
				'image/editor',
				plugins_url( 'build/backend/backend.editor.css', __FILE__ ),
				array( 'wp-edit-blocks' )
			);
		}

		public function get_folders()
		{
			global $wpdb;

			$sql = "SELECT *, folder_name as label, ID as value FROM {$wpdb->prefix}nice_image_folders";
			return $wpdb->get_results( $sql, 'ARRAY_A' );
		}

		public function page_html()
		{
			$media_id = isset($_REQUEST['image_id']) ? (int)$_REQUEST['image_id'] : 0;

			if( $media_id > 0 ){
				$images = array();
				$attachment_metadata = wp_get_attachment_metadata( $media_id );
				foreach ($attachment_metadata['sizes'] as $key => $value) {
					$attachment_metadata['sizes'][$key]['url'] = wp_get_attachment_image_src( $media_id, $key )[0];
				}

				$attachment_metadata['sizes']['original'] = array(
					'file' => $this->upload_dir['baseurl'] . '/' . $attachment_metadata['file'] . '?noCache=' . uniqid(),
					'width' => $attachment_metadata['width'],
					'height' => $attachment_metadata['height'],
					'unmodified' => '',
					'url' => wp_get_attachment_image_src( $media_id, 'full' )[0] . '?noCache=' . uniqid()
				);

				// check if we have a backup for this file
				$current_file = wp_basename( $attachment_metadata['file'] );
				$current_file_path = $this->backup_folder_path . '/' . $current_file;

				if( file_exists( $current_file_path ) ){

					$attachment_metadata['sizes']['original']['unmodified'] = $this->backup_folder_url . '/' . $current_file;
					$attachment_metadata['sizes']['original']['unmodified_time'] = date ("F d Y H:i:s.", filemtime( $current_file_path ) );
				}

				echo "<div id='AA_ImageEditor-wrapper' data-where='editor' data-post='" . esc_attr( json_encode( get_post( $media_id ) ) ) . "' data-image='" . esc_attr( json_encode( $attachment_metadata ) ) . "'></div>";
			}

			echo "<div id='AA_ImageEditor-wrapper' data-where='list'></div>";
		}

		private function scaled_image($attachment_id, $size = 'thumbnail')
		{
			$file = get_attached_file($attachment_id, true);
			if (empty($size) || $size === 'full') {
				// for the original size get_attached_file is fine
				return realpath($file);
			}
			if (! wp_attachment_is_image($attachment_id) ) {
				return false; // the id is not referring to a media
			}

			$info = image_get_intermediate_size($attachment_id, $size);

			if (!is_array($info) || ! isset($info['file'])) {
				return false; // probably a bad size argument
			}

			return array(
				'path' => realpath(str_replace(wp_basename($file), $info['file'], $file)),
				'url' => $info['url']
			);
		}

		private function print_response( $status='valid', $msg='', $data=array() )
		{
			die( json_encode( array(
				'status' => $status,
				'msg' => $msg,
				'data' => $data
			) ) );
		}

		function formatBytes($size, $precision = 2)
		{
			$base = log($size, 1024);
			$suffixes = array('', 'K', 'M', 'G', 'T');

			return round(pow(1024, $base - floor($base)), $precision) .' '. $suffixes[floor($base)];
		}

		public function create_backup_folder_path()
		{
			$files = array(
				array(
					'base'    => $this->backup_folder_path,
					'file'    => '.htaccess',
					'content' => 'Options -Indexes',
				),
				array(
					'base'    => $this->backup_folder_path,
					'file'    => 'index.html',
					'content' => '',
				),
			);

			foreach ( $files as $file ) {
				if ( wp_mkdir_p( $file['base'] ) && ! file_exists( trailingslashit( $file['base'] ) . $file['file'] ) ) {
					$file_handle = fopen( trailingslashit( $file['base'] ) . $file['file'], 'w' );

					if ( $file_handle ) {
						fwrite( $file_handle, $file['content'] );
						fclose( $file_handle );
					}
				}
			}
		}

		public function backup_file( $attID=0 )
		{
			$original_file = get_attached_file( $attID, false );
			if( file_exists( $original_file ) ) {

				$backup_file_path = $this->backup_folder_path . '/' . basename( $original_file );

				// exit if file already exist
				if( file_exists( $backup_file_path ) ) return true;

				// check if backup folder exist, if not create it
				$this->create_backup_folder_path();

				// move the original image to backup directory
				rename( $original_file, $backup_file_path );
			}
		}

		public function ajax_request()
		{
			$request = json_decode( file_get_contents("php://input"), true );
			if( $request['sub_action'] == 'save_image' ){

				if( $request['size'] == 'original' ){

					// let's try to backup the current file
					$this->backup_file( $request['attID'] );

					// get original file name and paths
					$current_file = get_post_meta( $request['attID'], '_wp_attached_file', true );
					$current_file_path = $this->upload_dir['basedir'] . '/' . $current_file;
					$current_file_url = $this->upload_dir['baseurl'] . '/' . $current_file;

					// save the image
					$new_image = base64_decode( end( explode(",", $request['imgBase64'] ) ) );
					$status = file_put_contents( $current_file_path, $new_image );

					// get new image size and update if needed
					$new_image_size = getimagesize( $current_file_path );

					$_wp_attachment_metadata = get_post_meta( $request['attID'], '_wp_attachment_metadata', true );
					$diff = false;

					if( $_wp_attachment_metadata['width'] != $new_image_size[0] ){
						$diff = true;
						$_wp_attachment_metadata['width'] = $new_image_size[0];
					}
					if( $_wp_attachment_metadata['height'] != $new_image_size[1] ){
						$diff = true;
						$_wp_attachment_metadata['height'] = $new_image_size[1];
					}

					if( $diff ){
						update_post_meta( $request['attID'], '_wp_attachment_metadata', $_wp_attachment_metadata );
					}

					$this->save_image_status( $request['attID'], $request['size'], $this->formatBytes( $status ) );

					$this->print_response( 'valid', esc_html__('done', 'aa-provision-image-editor'), array(
						'new_size' 	=> $this->formatBytes( $status ),
						'image_url' => esc_url($current_file_url)
					) );
				}

				$scale_image = $this->scaled_image( $request['attID'], $request['size'] );
				if( $scale_image ){
					$status = false;

					if( file_exists($scale_image['path']) ){
						$new_image = base64_decode( end( explode(",", $request['imgBase64'] ) ) );
						$status = file_put_contents( $scale_image['path'], $new_image );
					}
					else{
						$this->print_response( 'invalid', esc_html__('Unable to find original image!', 'aa-provision-image-editor') );
					}

					$this->save_image_status( $request['attID'], $request['size'], $this->formatBytes( $status ) );

					$this->print_response( 'valid', esc_html__('done', 'aa-provision-image-editor'), array(
						'new_size' 	=> $this->formatBytes( $status ),
						'image_url' => $scale_image['url']
					) );
				}else{
					$this->print_response( 'invalid', esc_html__('Unable to find original image!', 'aa-provision-image-editor') );
				}
			}

			if( $request['sub_action'] == 'restore_image' ){
				if( $request['attID'] > 0 ) {
					$current_file = get_post_meta( $request['attID'], '_wp_attached_file', true );

					$current_file_name = wp_basename( $current_file );
					$backup_file_path = $this->backup_folder_path . '/' . $current_file_name;
					$real_file_path = $this->upload_dir['basedir'] . '/' . $current_file;

					// hope not ...
					if( !file_exists($backup_file_path) ){
						$this->print_response( 'invalid', esc_html__('Unable to find the original file into backup directory!', 'aa-provision-image-editor') );
					}

					// copy the backup image to original director
					$status = copy( $backup_file_path, $real_file_path );
					if( $status ){
						// update metadata
						// get image size and update if needed
						$new_image_size = getimagesize( $backup_file_path );

						$_wp_attachment_metadata = get_post_meta( $request['attID'], '_wp_attachment_metadata', true );
						$diff = false;

						if( $_wp_attachment_metadata['width'] != $new_image_size[0] ){
							$diff = true;
							$_wp_attachment_metadata['width'] = $new_image_size[0];
						}
						if( $_wp_attachment_metadata['height'] != $new_image_size[1] ){
							$diff = true;
							$_wp_attachment_metadata['height'] = $new_image_size[1];
						}

						if( $diff ){
							update_post_meta( $request['attID'], '_wp_attachment_metadata', $_wp_attachment_metadata );
						}

						// remove the backup image
						unlink( $backup_file_path );

						$this->print_response( 'valid', esc_html__('done', 'aa-provision-image-editor') );
					}

					$this->print_response( 'invalid', esc_html__('Unable to copy backup file over current image!', 'aa-provision-image-editor') );
				}
			}

			if( $request['sub_action'] == 'get_media' ){
				$this->get_media_list( $request );
			}

			if( $request['sub_action'] == 'save_new_folder' ){
				$this->save_new_folder( $request );
			}

			if( $request['sub_action'] == 'delete_folder' ){
				$this->delete_folder( $request );
			}

			if( $request['sub_action'] == 'get_folders' ){
				$this->get_folders_list( $request );
			}

			if( $request['sub_action'] == 'save_folder_link' ){
				$this->save_folder_link( $request );
			}

			if( $request['sub_action'] == 'remove_folder_link' ){
				$this->remove_folder_link( $request );
			}
		}

		public function recount_images( $folderID=0 )
		{
			global $wpdb;

			// count level 1, direct assignment
			$wpdb->query( "UPDATE {$wpdb->prefix}nice_image_folders folders SET count=( SELECT count(images.ID) FROM  {$wpdb->prefix}nice_image_folders2posts images WHERE folders.ID=images.folder_ID)" );

			$this->print_response( 'valid', esc_html__('done', 'aa-provision-image-editor') );
		}

		public function remove_folder_link( $request )
		{
			global $wpdb;
			$table = $wpdb->prefix . 'nice_image_folders2posts';
			$wpdb->delete( $table, array( 'post_ID' => $request['postID'] ) );

			$this->print_response( 'valid', esc_html__('done', 'aa-provision-image-editor') );
		}

		public function save_folder_link( $request )
		{
			global $wpdb;
			$table = $wpdb->prefix . 'nice_image_folders2posts';

			$exist = (int) $wpdb->get_var( $wpdb->prepare("SELECT ID from {$table} where post_ID=%d", $request['postID']) );

			if( $exist == 0 ) {
				$wpdb->insert(
					$table,
					array(
						'post_ID' => $request['postID'],
						'folder_ID' => $request['folderID']
					),
					array(
						'%d',
						'%d'
					)
				);
			}else{
				$wpdb->update(
					$table,
					array(
						'folder_ID' => $request['folderID']
					),
					array( 'post_ID' => $request['postID'] ),
					array(
						'%d'
					),
					array( '%d' )
				);
			}

			$this->recount_images( $request['folderID'] );

			$this->print_response( 'valid', esc_html__('done', 'aa-provision-image-editor') );
		}

		public function get_folders_list( $request )
		{
			global $wpdb;

			$table = $wpdb->prefix . 'nice_image_folders';
			$results = $wpdb->get_results( $wpdb->prepare("SELECT *, (SELECT COUNT(*) FROM {$table} WHERE parent_ID = folder.ID) AS folders_count from {$table} as folder WHERE 1=1 AND parent_ID=%d", $request['parentID']), ARRAY_A );

			$this->print_response( 'valid', esc_html__('done', 'aa-provision-image-editor'), array(
				'folders_list' => $results
			) );
		}

		public function delete_folder( $request )
		{
			global $wpdb;
			$wpdb->delete( $wpdb->prefix . 'nice_image_folders', array( 'ID' => $request['folderID'] ) );

			$this->print_response( 'valid', esc_html__('done', 'aa-provision-image-editor'), array(
				'new_folders_list' => $this->get_folders()
			) );
		}

		public function save_new_folder( $request )
		{
			global $wpdb;

			$table = $wpdb->prefix . 'nice_image_folders';
			$data = array( 'folder_name' => $request['folder_name'], 'parent_ID' => (int)$request['parent_folder_id'] );
			$format = array( '%s','%s' );
			$wpdb->insert( $table, $data, $format );
			$new_id = $wpdb->insert_id;

			$this->print_response( 'valid', esc_html__('done', 'aa-provision-image-editor'), array(
				'new_folders_list' => $this->get_folders()
			) );
		}

		public function save_image_status( $attID=0, $what='', $size='' )
		{
			if( $attID > 0 ){

				$image_status = get_post_meta( $attID, '_nice_image_status', true );
				if( !$image_status ){
					$image_status = array();
				}

				$image_status[$what] = $size;

				update_post_meta( $attID, '_nice_image_status', $image_status );
			}
		}

		public function get_media_list( $request )
		{
			global $wpdb;

			$totalsNb = $wpdb->get_var( "SELECT count(a.ID)
				FROM {$wpdb->prefix}posts AS a LEFT JOIN {$wpdb->prefix}nice_image_folders2posts AS b ON a.ID=b.post_ID
				WHERE 1=1

				" . ( $request['folderID'] > 0 ? 'AND b.folder_ID=' . $request['folderID'] : '' ) . "

				AND a.post_type = 'attachment'
				AND ((a.post_status = 'inherit'
				OR a.post_status = 'private'))
				ORDER BY a.post_date DESC");

			if( $totalsNb == 0 ){
				$this->print_response( 'no-items', esc_html__('no items', 'aa-provision-image-editor') );
			}

			$startAt = $request['per_page'] * ($request['paged']);

			$results = $wpdb->get_results( "SELECT a.*, b.folder_ID
			FROM {$wpdb->prefix}posts AS a LEFT JOIN {$wpdb->prefix}nice_image_folders2posts AS b ON a.ID=b.post_ID
			WHERE 1=1
			" . ( $request['folderID'] > 0 ? 'AND b.folder_ID=' . $request['folderID'] : '' ) . "

			AND (a.post_mime_type LIKE 'image/%')
			AND a.post_type = 'attachment'
			AND ((a.post_status = 'inherit'
			OR a.post_status = 'private'))
			ORDER BY a.post_date DESC
			LIMIT $startAt, {$request['per_page']}", ARRAY_A );

			$sizes = get_intermediate_image_sizes();

			array_push($sizes, 'original');
			
			$attachments = array();
			if ( $results && count($results) ){
				foreach ($results as $key => $value) {
					$attachment_image = wp_get_attachment_image_src( $value['ID'], 'thumbnail' );

					$status = get_post_meta( $value['ID'], '_nice_image_status', true );

					$images_by_sizes = array();
					foreach ($sizes as $size) {
						$images_by_sizes[$size] = wp_get_attachment_image_src( $value['ID'], $size );
					}

					$attachments[] = array(
						'ID' => $value['ID'],
						'folder_ID' => $value['folder_ID'],
						'post_title' => $value['post_title'],
						'post_date' => $value['post_date'],
						'status' => $status ? $status : false,
						'thumbnail' => $attachment_image[0],
						'filename' => basename( $attachment_image[0] ),
						'author' => get_the_author_meta( 'display_name' , $value['post_author'] ),
						'author_id' => $value['post_author'],
						'author_url' => admin_url( sprintf( "admin.php?page=image_editor&author=%d", $value['post_author'] ) ),
						'edit_url' => admin_url( sprintf( "admin.php?page=image_editor&image_id=%d", $value['ID'] ) ),
						'sizes' => $images_by_sizes
					);
				}

				$this->print_response( 'valid', esc_html__('done', 'aa-provision-image-editor'), array(
					'rows' => $attachments,
					'totals' => $totalsNb
				) );
			}

			$this->print_response( 'invalid', esc_html__('no items', 'aa-provision-image-editor') );
		}
	}
}


$AA_ImageEditor = AA_ImageEditor::getInstance();
function AA_ImageEditor() {
	global $AA_ImageEditor;
	return $AA_ImageEditor;
}

/**
 * Load plugin textdomain.
 *
 * @since 1.0.0
 */
function AA_PVIE_load_textdomain() {
  load_plugin_textdomain( 'aa-provision-image-editor', false, basename( dirname( __FILE__ ) ) ); 
}

add_action( 'plugins_loaded', 'AA_PVIE_load_textdomain' );
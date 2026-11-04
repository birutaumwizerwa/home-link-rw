-- Photos are compressed in the browser. These limits stop anyone uploading
-- oversized files by calling storage directly.
update storage.buckets
   set file_size_limit = 1048576,
       allowed_mime_types = array['image/webp', 'image/jpeg', 'image/png']
 where id = 'listing-images';

update storage.buckets
   set file_size_limit = 524288,
       allowed_mime_types = array['image/webp', 'image/jpeg', 'image/png']
 where id = 'avatars';

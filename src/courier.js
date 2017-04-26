let fs = require('fs-promise'),
    restify = require('restify'),
    s3 = require('aws-promised').s3();

function guidGenerator() {
    var S4 = function() {
        return (((1 + Math.random()) * 0x10000) | 0).toString(16).substring(1);
    };
    return (S4() + S4() + "-" + S4() + "-" + S4() + "-" + S4() + "-" + S4() + S4() + S4());
}

exports.serveClip = function(req, res, next) {
    let keyPath = [req.params.dwid, "rev", req.params.rev, req.params.ts],
        downloadPath = ["/opt", "mediasegments"].concat(keyPath).join("/"),
        downloadFolder = downloadPath.replace(/[^\/]*$/, ''),
        s3Params = {
            Bucket: "encrypted-stream.vidangel.com",
            Key: `${keyPath.join('/')}`
        },
        guid = guidGenerator();
        
    fs.mkdirs(downloadFolder).then(() => {
        s3.headObject(s3Params, (err,data) => {
            if (err) {
                req.log.error({
                    'msg': 'problem with object on S3',
                    'err': err
                });
                res.send(new restify.BadRequestError('problem retrieving media segment'));
            }
            else {
                let file = fs.createWriteStream(`${downloadPath}.${guid}`),
                    s3Pipe = s3.getObject(s3Params).createReadStream();
                
                s3Pipe.on('error', err => {
                    req.log.error({
                        'msg': 'problem with returning object to user',
                        'err': err
                    });
                    res.send(new restify.InternalError('An unknown error occurred'));                   
                });
                
                file.on('error', (err) => {
                    req.log.error({
                        'msg': 'problem creating file data or something',
                        'err': err
                    });
                    fs.remove(`${downloadPath}.${guid}`);
                }).on('finish', () => {
                    fs.move(`${downloadPath}.${guid}`, downloadPath);
                });
                
                s3Pipe.pipe(res);
                s3Pipe.pipe(file);
            }
        });
    }).catch(err => {
        req.log.error({
            'msg': 'cannot create write stream folders',
            'err': err
        });
        res.send(new restify.InternalError('An unknown error occurred'));
    });
};
import * as cdk from '@aws-cdk/core';
import * as ec2 from '@aws-cdk/aws-ec2';
import * as docdb from '@aws-cdk/aws-docdb';

export class DocumentDBCluster extends cdk.Construct {
    public readonly cluster: docdb.DatabaseCluster;
    constructor(scope: cdk.Construct, id: string, vpc: ec2.Vpc) {
        super(scope, id);

        let parameterGroup = new docdb.ClusterParameterGroup(scope, 'spaceone-parameter-group', {
            family: 'docdb4.0',
            parameters: {
                'tls': 'disabled'
            },
        })
        
        // https://github.com/spaceone-dev/launchpad/blob/master/conf/documentdb.conf
        const cluster = new docdb.DatabaseCluster(this, 'spaceone-db', {
            masterUser: {
                username: 'spaceone_adminmyuser', // NOTE: 'admin' is reserved by DocumentDB
                password: cdk.SecretValue.plainText('tDXXQTiuKl!')
            },
            instanceType: ec2.InstanceType.of(ec2.InstanceClass.T3, ec2.InstanceSize.MEDIUM),
            vpcSubnets: {
                subnetType: ec2.SubnetType.PRIVATE_ISOLATED,
            },
            backup: {
                retention: cdk.Duration.days(5),
                preferredWindow: '17:00-21:00'
            },
            instances: 1,
            port: 27017,
            parameterGroup: parameterGroup,
            engineVersion: '4.0.0',
            storageEncrypted: false,
            vpc: vpc,
        });

        this.cluster = cluster;
    }
}
import * as cdk from '@aws-cdk/core';
import * as ec2 from '@aws-cdk/aws-ec2';
import * as docdb from '@aws-cdk/aws-docdb';
import { EksProps } from '../props/eks-props';

export class DocumentDBCluster extends cdk.Construct {
    public readonly database: docdb.DatabaseCluster;
    public readonly username: string;
    public readonly password: string;

    constructor(scope: cdk.Construct, id: string, props: EksProps) {
        super(scope, id);

        // TODO: Prop file
        let masterUsername = 'spaceone_adminmyuser';
        let masterPassword = 'tDXXQTiuKl!';

        let parameterGroup = new docdb.ClusterParameterGroup(scope, 'spaceone-parameter-group', {
            family: 'docdb4.0',
            parameters: {
                'tls': 'disabled'
            },
        })
        
        // https://github.com/spaceone-dev/launchpad/blob/master/conf/documentdb.conf
        const cluster = new docdb.DatabaseCluster(this, 'spaceone-db', {
            masterUser: {
                username: masterUsername, // NOTE: 'admin' is reserved by DocumentDB
                password: cdk.SecretValue.plainText(masterPassword)
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
            vpc: props.cluster!.vpc,
            removalPolicy: cdk.RemovalPolicy.DESTROY
        });

        const docdbSg = ec2.SecurityGroup.fromSecurityGroupId(scope, 'docdb-sg', cluster.securityGroupId);
        docdbSg.addIngressRule(props.cluster!.clusterSecurityGroup, ec2.Port.tcp(27017), 'EKS to DocumentDB Ingress Rule');

        this.database = cluster
        this.username = masterUsername
        this.password = masterPassword
    }
}
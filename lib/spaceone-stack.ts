import * as ec2 from '@aws-cdk/aws-ec2'
import * as eks from '@aws-cdk/aws-eks'
import * as cdk from '@aws-cdk/core';
import * as iam from '@aws-cdk/aws-iam'

// let usersList = ['mzc_user04', 'mzc_user05'];

export class SpaceoneStack extends cdk.Stack {
  constructor(scope: cdk.Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // The code that defines your stack goes here
    const newVpc = new ec2.Vpc(this, 'hello-eks-vpc', {
      cidr: '10.0.0.0/16',
      maxAzs: 3,
      subnetConfiguration: [
        {
          name: 'public',
          subnetType: ec2.SubnetType.PUBLIC,
          cidrMask: 24
        },
        {
          name: 'private',
          subnetType: ec2.SubnetType.PRIVATE_WITH_NAT,
          cidrMask: 24
        },
      ]
    });

    // Master IAM Role
    // const mastersRole = new iam.Role(this, 'mastersRole', {
    //   assumedBy: new iam.AccountRootPrincipal()
    // });

    // provisiong a cluster
    const cluster = new eks.Cluster(this, 'hello-eks', {
      clusterName: 'hello-eks',
      version: eks.KubernetesVersion.V1_19,
      defaultCapacity: 0,
      // defaultCapacityInstance: ec2.InstanceType.of(ec2.InstanceClass.T3A, ec2.InstanceSize.MEDIUM),
      vpc: newVpc,
      vpcSubnets: [{ subnetType: ec2.SubnetType.PRIVATE_WITH_NAT }],
      // mastersRole: mastersRole
    });

    // Node Group 선언
    cluster.addNodegroupCapacity('spaceone-prod-core-nodegroup', {
      desiredSize: 2,
      instanceTypes: [ec2.InstanceType.of(ec2.InstanceClass.T3A, ec2.InstanceSize.MEDIUM)],
      diskSize: 20,
      labels: {"Environment": "prod", "Category": "core"},
      tags: {"Environment": "prod", "Category": "core"},
    });
    cluster.addNodegroupCapacity('spaceone-prod-supervisor-nodegroup', {
      desiredSize: 2,
      instanceTypes: [ec2.InstanceType.of(ec2.InstanceClass.T3A, ec2.InstanceSize.MEDIUM)],
      diskSize: 20,
      labels: {"Environment": "prod", "Category": "supervisor"},
      tags: {"Environment": "prod", "Category": "supervisor"},
    })

    // 클러스터의 aws-auth 설정
    // 현재 addMastersRole 이나 addRoleMapping 를 하면 addUserMapping 에 넣은 user 가 실제로는 들어가지 않는 문제가 있음
    // 별도로 설정이 필요한 상황은 아닌것으로 보여 일단 주석처리

    // const awsAuth = new eks.AwsAuth(this, 'clusterAuth', {
    //   cluster: cluster
    // });

    // usersList.forEach(function(data, index) {
    //   awsAuth.addUserMapping(iam.User.fromUserName($this, data, data), {
    //     username: data,
    //     groups: ["system:masters"],
    //   });
    // });

    // // Apply 된 Cluster 를 업데이트 하면 기본 생성되는 Master Role 이 사라지는데 무슨 문제일까?
    // awsAuth.addMastersRole(
    //   iam.Role.fromRoleArn(this, 'mastersRoleAtAwsAuth', mastersRole.roleArn),
    //   mastersRole.roleName
    // );

    // // Cluster IAM Role
    // awsAuth.addRoleMapping(cluster.role, {
    //   groups: ["system:bootstrappers", "system:nodes"],
    //   username: "system:node:{{EC2PrivateDNSName}}"
    // });

    // apply a kubernetes manifest to the cluster
    // cluster.addManifest('mypod', {
    //   apiVersion: 'v1',
    //   kind: 'Pod',
    //   metadata: { name: 'mypod' },
    //   spec: {
    //     containers: [
    //       {
    //         name: 'hello',
    //         image: 'paulbouwer/hello-kubernetes:1.5',
    //         ports: [ { containerPort: 8080 } ]
    //       }
    //     ]
    //   }
    // });
  }
}

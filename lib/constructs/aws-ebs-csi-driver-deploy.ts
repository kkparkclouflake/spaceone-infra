import * as cdk from '@aws-cdk/core';
import * as eks from '@aws-cdk/aws-eks';
import * as iam from '@aws-cdk/aws-iam';

import * as fs from 'fs';

import { EksProps } from '../props/eks-props'

// from https://docs.aws.amazon.com/eks/latest/userguide/add-ons-images.html
let imagePaths = {
	"af-south-1": "877085696533.dkr.ecr.af-south-1.amazonaws.com/",
	"ap-east-1": "800184023465.dkr.ecr.ap-east-1.amazonaws.com/",
	"ap-northeast-1": "602401143452.dkr.ecr.ap-northeast-1.amazonaws.com/",
	"ap-northeast-2": "602401143452.dkr.ecr.ap-northeast-2.amazonaws.com/",
	"ap-northeast-3": "602401143452.dkr.ecr.ap-northeast-3.amazonaws.com/",
	"ap-south-1": "602401143452.dkr.ecr.ap-south-1.amazonaws.com/",
	"ap-southeast-1": "602401143452.dkr.ecr.ap-southeast-1.amazonaws.com/",
	"ap-southeast-2": "602401143452.dkr.ecr.ap-southeast-2.amazonaws.com/",
	"ca-central-1": "602401143452.dkr.ecr.ca-central-1.amazonaws.com/",
	"cn-north-1": "918309763551.dkr.ecr.cn-north-1.amazonaws.com.cn/",
	"cn-northwest-1": "961992271922.dkr.ecr.cn-northwest-1.amazonaws.com.cn/",
	"eu-central-1": "602401143452.dkr.ecr.eu-central-1.amazonaws.com/",
	"eu-north-1": "602401143452.dkr.ecr.eu-north-1.amazonaws.com/",
	"eu-south-1": "590381155156.dkr.ecr.eu-south-1.amazonaws.com/",
	"eu-west-1": "602401143452.dkr.ecr.eu-west-1.amazonaws.com/",
	"eu-west-2": "602401143452.dkr.ecr.eu-west-2.amazonaws.com/",
	"eu-west-3": "602401143452.dkr.ecr.eu-west-3.amazonaws.com/",
	"me-south-1": "558608220178.dkr.ecr.me-south-1.amazonaws.com/",
	"sa-east-1": "602401143452.dkr.ecr.sa-east-1.amazonaws.com/",
	"us-east-1": "602401143452.dkr.ecr.us-east-1.amazonaws.com/",
	"us-east-2": "602401143452.dkr.ecr.us-east-2.amazonaws.com/",
	"us-gov-east-1": "151742754352.dkr.ecr.us-gov-east-1.amazonaws.com/",
	"us-gov-west-1": "013241004608.dkr.ecr.us-gov-west-1.amazonaws.com/",
	"us-west-1": "602401143452.dkr.ecr.us-west-1.amazonaws.com/",
	"us-west-2": "602401143452.dkr.ecr.us-west-2.amazonaws.com/"
}

export class AwsEbsCsiDriverDeploy extends cdk.Construct {
    public readonly body: cdk.Construct;

    constructor(scope: cdk.Construct, id: string, eks: EksProps) {
        super(scope, id);

        // Default Image Path (us-west-2)
        let imagePath = '602401143452.dkr.ecr.us-west-2.amazonaws.com/eks/aws-ebs-csi-driver';

        // Determine Regional Image Path
        if (typeof eks.env?.region === 'string') {
            const keyTyped = eks.env?.region as keyof typeof imagePaths;
            imagePath = imagePaths[keyTyped] + 'eks/aws-ebs-csi-driver';
        }

        // Load IAM Policy from file
        let iamPolicyDocument = JSON.parse(fs.readFileSync('./res/iam/policies/aws-ebs-csi-driver-v1.3-iam-policy.json').toString());

        // Create Kubernetes ServiceAccount
        let svcAccount = eks.cluster.addServiceAccount('ebs-csi-controller-sa', {
            name: 'ebs-csi-controller-sa',
            namespace: 'kube-system',
        });

        // Create IAM Policy
        const iamPolicy = new iam.Policy(scope, 'AmazonEKS_EBS_CSI_Driver_Policy', {
            policyName: 'AmazonEKS_EBS_CSI_Driver_Policy',
            document: iam.PolicyDocument.fromJson(iamPolicyDocument),
        })

        // Attach IAM role
        svcAccount.role.attachInlinePolicy(iamPolicy);

        // Install EBS CSI Driver
        this.body = eks.cluster.addHelmChart('aws-ebs-csi-driver', {
            release: 'aws-ebs-csi-driver',
            repository: 'https://kubernetes-sigs.github.io/aws-ebs-csi-driver',
            chart: 'aws-ebs-csi-driver',
            namespace: 'kube-system',
            values: {
                'image': {
                    'repository': imagePath
                },
                'controller': {
                    'serviceAccount': {
                        'create': false,
                        'name': svcAccount.serviceAccountName
                    }
                }
            },
        })
    }
}
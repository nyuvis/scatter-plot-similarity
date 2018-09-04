#!/usr/bin/env python
from __future__ import print_function
from __future__ import division
__author__ = 'avp'
## http://stackoverflow.com/questions/4860417/placing-custom-images-in-a-plot-window-as-custom-data-markers-or-to-annotate-t
import matplotlib.pyplot as PLT
from matplotlib.offsetbox import AnnotationBbox, OffsetImage
from matplotlib._png import read_png
import matplotlib.patches as patches
from matplotlib.cm import get_cmap

from pathlib import Path

def add_plot(groups,f,x,y,scale):
    # add a first image
    x = float(x)
    y = float(y)
    arr_hand = read_png(f)
    imagebox = OffsetImage(arr_hand, zoom=.05)
    xy = [x, y]               # coordinates to position this image
    #color = 'red'
    clusters=20
    img_name = Path(f).name
    gid = groups[img_name] if img_name in groups else clusters-1
    color = get_cmap(name='Paired', lut=clusters)(gid)

    ab = AnnotationBbox(imagebox, xy,
        xybox=(30., -30.),
        xycoords='data',
        boxcoords="offset points")
    rect = patches.Rectangle(
        (x,y), scale*.05, -scale*.05,
        fill=True,
        color=color,
        edgecolor=color
    )
    return ab, rect

def compute(postfix, cluster_postfix, rx, ry, scale):
    groups = {}
    with open('../results/clustering{0}.csv'.format(cluster_postfix)) as o:
        lines = o.readlines()
        files = lines[0].rstrip().split(",")[2:]
        index = lines[1].rstrip().split(",")[2:]
        files = [ f.strip('"') for f in files ]
        index = [ int(ix.strip('"')) for ix in index ]
        for (ix, g) in enumerate(index):
            groups[files[ix]] = g

    with open('../results/projection{0}.csv'.format(postfix),'rU') as f:
        fig = PLT.gcf()
        fig.clf()
        fig.set_size_inches(50, 50)
        ax = PLT.subplot(111)
        ax.set_xlim(rx)
        ax.set_ylim(ry)
        files = {}
        all_abs = []
        lines = f.readlines()
        for li in lines[1:]:
            l = li.split(',')
            if l[0] not in files:
                image_path = '../plots/' + l[0]
                ab_ret, rect = add_plot(groups, image_path, l[1], l[2], scale)
                all_abs.append(ab_ret)
                ax.add_patch(rect)
            else:
                print("damn!")
                pass

        print(len(all_abs))
        for a in all_abs:
            ax.add_artist(a)
        ax.grid(False)
        PLT.draw()
        # PLT.show()
        fig.savefig('../results/projected{0}{1}.png'.format(postfix, cluster_postfix),dpi=100)

compute('_empirical', '_empirical', [-100,150], [-150,100], 30.0)
compute('_scags', '_empirical', [-1,1], [-1,1], 30.0/100.0)
compute('_scags', '_scags', [-1,1], [-1,1], 30.0/100.0)
